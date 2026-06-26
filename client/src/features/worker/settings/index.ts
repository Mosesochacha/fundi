import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  mergeSettings,
  type UpdateAvailabilityInput,
  type UpdateEmailInput,
  type UpdateNotificationsInput,
  type UpdatePasswordInput,
  type UpdatePhoneInput,
  type UpdatePrivacyInput,
  type UpdateProfileInput,
  type WorkerSettings,
  workerSettingsService,
} from "./services/settings.service";

export * from "./services/settings.service";

const SETTINGS_KEY = ["worker", "settings"] as const;

/** Load the full worker settings document on mount. */
export function useGetWorkerSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: () => workerSettingsService.get(),
    select: (res): WorkerSettings =>
      mergeSettings(res.data?.data as Partial<WorkerSettings> | undefined),
    staleTime: 1000 * 60,
  });
}

function useSettingsMutation<TInput>(
  mutationFn: (input: TInput) => Promise<unknown>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => qc.invalidateQueries({ queryKey: SETTINGS_KEY }),
  });
}

export function useUpdateProfile() {
  return useSettingsMutation((data: UpdateProfileInput) =>
    workerSettingsService.updateProfile(data),
  );
}

export function useUploadAvatar() {
  return useSettingsMutation((file: File) =>
    workerSettingsService.uploadAvatar(file),
  );
}

export function useRemoveAvatar() {
  return useSettingsMutation<void>(() => workerSettingsService.removeAvatar());
}

export function useUpdateEmail() {
  return useSettingsMutation((data: UpdateEmailInput) =>
    workerSettingsService.updateEmail(data),
  );
}

export function useVerifyEmail() {
  return useSettingsMutation<void>(() => workerSettingsService.verifyEmail());
}

export function useUpdatePhone() {
  return useSettingsMutation((data: UpdatePhoneInput) =>
    workerSettingsService.updatePhone(data),
  );
}

export function useVerifyPhone() {
  return useSettingsMutation<void>(() => workerSettingsService.verifyPhone());
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (data: UpdatePasswordInput) =>
      workerSettingsService.updatePassword(data),
  });
}

export function useDisconnectGoogle() {
  return useSettingsMutation<void>(() =>
    workerSettingsService.disconnectGoogle(),
  );
}

export function useUpdateNotifications() {
  return useSettingsMutation((data: UpdateNotificationsInput) =>
    workerSettingsService.updateNotifications(data),
  );
}

export function useUpdatePrivacy() {
  return useSettingsMutation((data: UpdatePrivacyInput) =>
    workerSettingsService.updatePrivacy(data),
  );
}

export function useUpdateAvailability() {
  return useSettingsMutation((data: UpdateAvailabilityInput) =>
    workerSettingsService.updateAvailability(data),
  );
}

export function usePauseAccount() {
  return useSettingsMutation<void>(() => workerSettingsService.pauseAccount());
}

export function useExportData() {
  return useMutation({
    mutationFn: () => workerSettingsService.exportData(),
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: () => workerSettingsService.deleteAccount(),
  });
}
