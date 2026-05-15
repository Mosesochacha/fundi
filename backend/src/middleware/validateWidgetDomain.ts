import { Request, Response, NextFunction, RequestHandler } from 'express';
import { HTTP_STATUS } from '../utils/constants';
import { sendError } from '../utils/helpers';
import logger from '../utils/logger';
import db from '../models';

export const validateWidgetDomain: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orgId } = req.params;
    
    if (!orgId) {
      sendError(res, HTTP_STATUS.BAD_REQUEST, 'Organization ID is required');
      return;
    }

    const embedOriginRaw = req.headers['x-embed-origin'] || req.headers['X-Embed-Origin'];
    const embedRefererRaw = req.headers['x-embed-referer'] || req.headers['X-Embed-Referer'];
    const browserRefererRaw = req.headers['referer'] || req.headers['origin'];
    
    const embedOrigin = Array.isArray(embedOriginRaw) ? embedOriginRaw[0] : embedOriginRaw;
    const embedReferer = Array.isArray(embedRefererRaw) ? embedRefererRaw[0] : embedRefererRaw;
    const browserReferer = Array.isArray(browserRefererRaw) ? browserRefererRaw[0] : browserRefererRaw;
    
    if (embedOrigin || embedReferer) {
      const validateUrl = (url: string | undefined, headerName: string): boolean => {
        if (!url) return true;
        try {
          const parsed = new URL(url);
          if (!['http:', 'https:'].includes(parsed.protocol)) {
            logger.warn(`[SECURITY] Invalid protocol in ${headerName}`, {
              url,
              protocol: parsed.protocol,
              orgId,
              ip: req.ip,
            });
            return false;
          }
          if (process.env.NODE_ENV === 'production') {
            const hostname = parsed.hostname.toLowerCase();
            const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.');
            if (isLocalhost) {
              logger.warn(`[SECURITY] Localhost/private IP detected in ${headerName} in production`, {
                url,
                hostname,
                orgId,
                ip: req.ip,
              });
              return false;
            }
          }
          return true;
        } catch (error) {
          logger.warn(`[SECURITY] Invalid URL format in ${headerName}`, {
            url,
            error: error instanceof Error ? error.message : 'Unknown error',
            orgId,
            ip: req.ip,
          });
          return false;
        }
      };

      if (!validateUrl(embedOrigin, 'X-Embed-Origin') || !validateUrl(embedReferer, 'X-Embed-Referer')) {
        logger.warn('[SECURITY] Invalid custom embed headers detected - potential spoofing attempt', {
          orgId,
          embedOrigin,
          embedReferer,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        });
        sendError(res, HTTP_STATUS.FORBIDDEN, 'Invalid embed headers');
        return;
      }

      let embedOriginDomain: string | null = null;
      let embedRefererDomain: string | null = null;
      
      try {
        if (embedOrigin) {
          embedOriginDomain = new URL(embedOrigin).hostname.toLowerCase();
        }
        if (embedReferer) {
          embedRefererDomain = new URL(embedReferer).hostname.toLowerCase();
        }
      } catch (error) {
        logger.warn('[SECURITY] Failed to parse custom embed header domains', {
          orgId,
          embedOrigin,
          embedReferer,
          ip: req.ip,
        });
        sendError(res, HTTP_STATUS.FORBIDDEN, 'Invalid embed header format');
        return;
      }

      if (embedOriginDomain && embedRefererDomain && embedOriginDomain !== embedRefererDomain) {
        logger.warn('[SECURITY] Domain mismatch between X-Embed-Origin and X-Embed-Referer - potential spoofing', {
          orgId,
          embedOriginDomain,
          embedRefererDomain,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        });
      }
    }
    
    let referer = embedReferer || embedOrigin;
    
    if (!referer && browserReferer) {
      referer = browserReferer;
      logger.info('[SECURITY] Falling back to browser Referer header', {
        orgId,
        browserReferer,
        ip: req.ip,
        path: req.path,
      });
    }
    
    if (!referer) {
      logger.warn('[SECURITY] Domain validation failed: Missing embed headers', {
        orgId,
        ip: req.ip,
        path: req.path,
        hasBrowserReferer: !!browserReferer,
      });
      sendError(res, HTTP_STATUS.FORBIDDEN, 'Missing embed headers');
      return;
    }
    
    let refererDomain: string;
    try {
      const refererUrl = new URL(referer);
      refererDomain = refererUrl.hostname.toLowerCase();
    } catch (error) {
      logger.warn('Domain validation failed: Invalid Referer URL', {
        orgId,
        referer,
        ip: req.ip,
      });
      sendError(res, HTTP_STATUS.FORBIDDEN, 'Invalid Referer header format');
      return;
    }
    
    const org = await db.Organization.findByPk(orgId);
    if (!org) {
      sendError(res, HTTP_STATUS.NOT_FOUND, 'Organization not found');
      return;
    }
    
    const dbDomains = (org.allowedDomains || []).map((d: string) => d.toLowerCase()).filter(Boolean);
    const allowedDomains = [...new Set(dbDomains)];
    
    if (allowedDomains.length === 0) {
      logger.warn('Domain validation: No allowed domains configured, blocking access', {
        orgId,
        refererDomain,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      sendError(res, HTTP_STATUS.FORBIDDEN, 'Domain not authorized. No allowed domains configured for this organization.');
      return;
    }
    
    const isLocalhost = refererDomain === 'localhost' || refererDomain === '127.0.0.1' || refererDomain.startsWith('localhost:') || refererDomain.startsWith('127.0.0.1:');
    
    if (process.env.NODE_ENV === 'development' && isLocalhost) {
      logger.debug('Domain validation: Allowing localhost in development', {
        orgId,
        refererDomain,
        ip: req.ip,
      });
      next();
      return;
    }
    
    const isAllowed = allowedDomains.some(domain => {
      const exactMatch = refererDomain === domain;
      const subdomainMatch = refererDomain.endsWith('.' + domain);
      return exactMatch || subdomainMatch;
    });
    
    if ((embedOrigin || embedReferer) && isAllowed) {
      logger.info('[SECURITY] Custom embed headers used - validated against allowed domains', {
        orgId,
        refererDomain,
        embedOrigin,
        embedReferer,
        browserReferer,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        allowedDomains,
      });
      
      if (browserReferer) {
        try {
          const browserDomain = new URL(browserReferer).hostname.toLowerCase();
          if (refererDomain !== browserDomain) {
            logger.info('[SECURITY] Domain mismatch between custom headers and browser headers (expected in iframe scenarios)', {
              orgId,
              customHeaderDomain: refererDomain,
              browserDomain,
              embedOrigin,
              embedReferer,
              browserReferer,
              ip: req.ip,
              note: 'This is normal for iframe embeds, but logged for security monitoring',
            });
          }
        } catch (error) {
        }
      }
    }
    
    if (!isAllowed) {
      if (embedOrigin || embedReferer) {
        logger.warn('[SECURITY] SPOOFING ATTEMPT DETECTED: Custom embed headers used with unauthorized domain', {
          orgId,
          refererDomain,
          embedOrigin,
          embedReferer,
          allowedDomains,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          browserReferer,
          severity: 'HIGH',
        });
      }
      logger.warn('Domain validation failed', {
        orgId,
        refererDomain,
        allowedDomains,
        dbDomains: dbDomains.length,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        customHeadersUsed: !!(embedOrigin || embedReferer),
      });
      sendError(res, HTTP_STATUS.FORBIDDEN, 'Domain not authorized');
      return;
    }
    
    const matchedDomain = allowedDomains.find(d => 
      refererDomain === d || refererDomain.endsWith('.' + d)
    );
    logger.debug('Domain validation passed', {
      orgId,
      refererDomain,
      matchedDomain,
    });
    
    next();
  } catch (error: any) {
    logger.error('Error in domain validation middleware', {
      error: error.message,
      stack: error.stack,
      orgId: req.params.orgId,
    });
    sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Domain validation error');
    return;
  }
};

export default validateWidgetDomain;

