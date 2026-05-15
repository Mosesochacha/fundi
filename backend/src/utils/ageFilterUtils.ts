import { Sequelize } from "sequelize";

const AGE_DEFAULT_MAX = 120;

const UNSPECIFIED_AGE_LITERAL = `(
  "ageCriteria" IS NULL OR
  TRIM("ageCriteria") = '' OR
  LOWER(TRIM("ageCriteria")) LIKE '%no age limit%' OR
  LOWER(TRIM("ageCriteria")) LIKE '%all ages%' OR
  LOWER(TRIM("ageCriteria")) LIKE '%no specific age requirement mentioned%' OR
  LOWER(TRIM("ageCriteria")) LIKE '%no age requirement%'
)`;

const isNumeric = (value?: number) => typeof value === "number" && Number.isFinite(value);

export interface AgeFilterOptions {
  ageMin?: number;
  ageMax?: number;
  onlyNoAgeRequirement?: boolean;
}

export function buildAgeFilterLiterals(options: AgeFilterOptions = {}) {
  const { ageMin, ageMax, onlyNoAgeRequirement } = options;

  if (onlyNoAgeRequirement) {
    return [Sequelize.literal(UNSPECIFIED_AGE_LITERAL)];
  }

  const hasMin = isNumeric(ageMin);
  const hasMax = isNumeric(ageMax);
  if (!hasMin && !hasMax) {
    return [];
  }

  const requestedMin = hasMin ? ageMin! : 0;
  const requestedMax = hasMax ? ageMax! : AGE_DEFAULT_MAX;
  const filterMin = Math.min(requestedMin, requestedMax);
  const filterMax = Math.max(requestedMin, requestedMax);

  const digitsOnlyExpression = `CAST(REGEXP_REPLACE(LOWER(TRIM("ageCriteria")), '[^0-9]', '', 'g') AS INTEGER)`;
  const rangeRegex = "[0-9]+\\s*(?:-|–|to|and)\\s*[0-9]+";
  const plusRegex = "[0-9]+\\s*\\+";
  const underRegex = "^under[^0-9]*[0-9]+";
  const overRegex = "^over[^0-9]*[0-9]+";

  return [
    Sequelize.literal(UNSPECIFIED_AGE_LITERAL),
    Sequelize.literal(`(
      LOWER(TRIM("ageCriteria")) ~ '${rangeRegex}' AND
      CAST(SUBSTRING("ageCriteria" FROM '^\\s*([0-9]+)') AS INTEGER) <= ${filterMax} AND
      CAST(SUBSTRING("ageCriteria" FROM '([0-9]+)\\s*$') AS INTEGER) >= ${filterMin}
    )`),
    Sequelize.literal(`(
      LOWER(TRIM("ageCriteria")) ~ '${plusRegex}' AND
      CAST(SUBSTRING("ageCriteria" FROM '([0-9]+)') AS INTEGER) <= ${filterMax}
    )`),
    Sequelize.literal(`(
      LOWER(TRIM("ageCriteria")) ~ '${overRegex}' AND
      ${digitsOnlyExpression} <= ${filterMax}
    )`),
    Sequelize.literal(`(
      LOWER(TRIM("ageCriteria")) ~ '${underRegex}' AND
      ${digitsOnlyExpression} >= ${filterMin}
    )`),
    Sequelize.literal(`(
      "ageCriteria" ~ '^\\s*[0-9]+\\s*$' AND
      CAST(TRIM("ageCriteria") AS INTEGER) >= ${filterMin} AND
      CAST(TRIM("ageCriteria") AS INTEGER) <= ${filterMax}
    )`),
  ];
}

