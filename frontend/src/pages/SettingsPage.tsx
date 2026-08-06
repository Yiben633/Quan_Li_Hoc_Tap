import { zodResolver } from "@hookform/resolvers/zod";
import {
  Camera,
  Check,
  KeyRound,
  Save,
  Settings2,
  Shield,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
  Avatar,
  Badge,
  Button,
  Input,
  Select,
  Switch,
  Tabs,
  Textarea,
} from "../components/ui";
import { AvatarCropper } from "../components/AvatarCropper";
import { getApiErrorMessage } from "../features/auth/auth.api";
import {
  useNotificationSettingsQuery,
  useProfileQuery,
  useUpdateNotificationSettingsMutation,
  useUpdatePasswordMutation,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
} from "../features/users/users.hooks";
import {
  passwordSchema,
  profileSchema,
  type PasswordValues,
  type ProfileValues,
} from "../features/users/users.schemas";
import { useAuthStore } from "../stores/authStore";

type Tab = "profile" | "security" | "appearance" | "notifications";
const defaultProfile: ProfileValues = {
  fullName: "",
  school: "",
  major: "",
  courseYear: "",
  timezone: "Asia/Ho_Chi_Minh",
  language: "vi",
  themeMode: "light",
  learningPurpose: "",
  preferredStyle: "mixed",
  ageGroup: "adult",
};
export function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");
  return (
    <div className="settings-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">CÁ NHÂN HÓA WORKSPACE</p>
          <h1>Cài đặt</h1>
          <p className="subtle">
            Thiết lập StudyFlow theo nhịp sống và mục tiêu của bạn.
          </p>
        </div>
      </div>
      <div className="settings-layout">
        <aside className="settings-nav">
          <div className="settings-nav-title">
            <Settings2 size={17} /> Cài đặt tài khoản
          </div>
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              {
                value: "profile",
                label: (
                  <>
                    <UserRound size={15} /> Hồ sơ
                  </>
                ),
              },
              {
                value: "security",
                label: (
                  <>
                    <Shield size={15} /> Bảo mật
                  </>
                ),
              },
              {
                value: "appearance",
                label: (
                  <>
                    <SlidersHorizontal size={15} /> Giao diện
                  </>
                ),
              },
              {
                value: "notifications",
                label: (
                  <>
                    <Check size={15} /> Nhắc nhở
                  </>
                ),
              },
            ]}
          />
        </aside>
        <section className="settings-content">
          {tab === "profile" && <ProfileSettings />}
          {tab === "security" && <SecuritySettings />}
          {tab === "appearance" && <AppearanceSettings />}
          {tab === "notifications" && <NotificationSettings />}
        </section>
      </div>
    </div>
  );
}

function ProfileSettings() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const query = useProfileQuery();
  const update = useUpdateProfileMutation();
  const avatar = useUploadAvatarMutation();
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const initialValues = useRef<ProfileValues>(defaultProfile);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
    watch,
    setValue,
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    mode: "onChange",
    defaultValues: defaultProfile,
  });
  useEffect(() => {
    if (query.data) {
      const context = JSON.parse(
        localStorage.getItem("studyflow_profile_context") ?? "{}",
      ) as Partial<ProfileValues>;
      const nextValues: ProfileValues = {
        ...defaultProfile,
        ...context,
        fullName: query.data.fullName,
        school: query.data.school ?? "",
        major: query.data.major ?? "",
        courseYear: query.data.courseYear?.toString() ?? "",
        timezone: query.data.timezone ?? defaultProfile.timezone,
        language: query.data.language === "en" ? "en" : "vi",
        themeMode: query.data.themeMode === "dark" ? "dark" : "light",
      };
      initialValues.current = nextValues;
      reset(nextValues);
    }
  }, [query.data, reset]);
  const submit = (values: ProfileValues) => {
    const effectiveTheme =
      values.themeMode === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : values.themeMode;
    update.mutate(
      {
        fullName: values.fullName,
        school: values.school || null,
        major: values.major || null,
        courseYear: values.courseYear ? Number(values.courseYear) : null,
        timezone: values.timezone,
        language: values.language,
        themeMode: effectiveTheme,
      },
      {
        onSuccess: (next) => {
          localStorage.setItem(
            "studyflow_profile_context",
            JSON.stringify({
              learningPurpose: values.learningPurpose,
              preferredStyle: values.preferredStyle,
              ageGroup: values.ageGroup,
              themeMode: values.themeMode,
            }),
          );
          setUser(next);
          initialValues.current = values;
          reset(values);
          document.documentElement.dataset.theme =
            values.themeMode === "dark" ||
            (values.themeMode === "system" &&
              window.matchMedia("(prefers-color-scheme: dark)").matches)
              ? "dark"
              : "light";
          toast.success("Đã lưu hồ sơ cá nhân");
        },
        onError: (error) =>
          toast.error(getApiErrorMessage(error, "Không thể lưu hồ sơ")),
      },
    );
  };
  const chooseAvatar = (nextFile?: File) => {
    if (!nextFile) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(nextFile.type) ||
      nextFile.size > 2 * 1024 * 1024
    ) {
      toast.error("Avatar cần là JPG, PNG hoặc WEBP và tối đa 2MB");
      return;
    }
    setCropFile(nextFile);
  };
  const saveAvatar = (cropped: File) => avatar.mutate(cropped, { onSuccess: (next) => { setUser(next); setPreview(""); toast.success("Đã cập nhật ảnh đại diện"); }, onError: (error) => { setPreview(""); toast.error(getApiErrorMessage(error, "Không thể cập nhật avatar")); } });
  const hasChanges = isDirty || Boolean(cropFile) || avatar.isPending;
  return (
    <>
      <AvatarCropper file={cropFile} onCancel={() => setCropFile(null)} onComplete={(cropped) => { setPreview(URL.createObjectURL(cropped)); setCropFile(null); saveAvatar(cropped); }} />
      <SettingsSection
      icon={<UserRound size={18} />}
      title="Hồ sơ cá nhân"
      description="Chỉ những thông tin cần thiết mới được yêu cầu. Bạn có thể bỏ qua toàn bộ phần trường lớp."
    >
      <div className="profile-hero">
        <div className="avatar-upload">
          <Avatar
            name={user?.fullName ?? "Bạn học"}
            src={preview || user?.avatarUrl || undefined}
            size="lg"
          />
          <label className="avatar-camera">
            <Camera size={15} />
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => chooseAvatar(event.target.files?.[0])}
            />
          </label>
        </div>
        <div>
          <strong>{user?.email ?? "Tài khoản StudyFlow"}</strong>
          <p className="subtle">Ảnh JPG, PNG hoặc WEBP, tối đa 2MB.</p>
          {avatar.isPending && <p className="subtle">Đang lưu ảnh đại diện...</p>}
        </div>
      </div>
      <form
        className="settings-form"
        onSubmit={handleSubmit(submit)}
        noValidate
      >
        <div className="settings-form-grid">
          <Input
            label="Họ và tên"
            error={errors.fullName?.message}
            {...register("fullName")}
          />
        </div>
        <Textarea
          label="Mục tiêu hoặc bối cảnh của bạn (tùy chọn)"
          placeholder="StudyFlow sẽ giúp bạn sắp xếp điều gì?"
          error={errors.learningPurpose?.message}
          {...register("learningPurpose")}
        />
        <div className="settings-form-grid">
          <Select customMenu label="Phong cách học" value={watch("preferredStyle")} onChange={(event) => setValue("preferredStyle", event.target.value as ProfileValues["preferredStyle"], { shouldDirty: true, shouldValidate: true })}>
            <option value="short">Ngắn và đều</option>
            <option value="deep">Tập trung sâu</option>
            <option value="mixed">Kết hợp</option>
          </Select>
          <Select customMenu label="Nhóm tuổi (tùy chọn)" value={watch("ageGroup")} onChange={(event) => setValue("ageGroup", event.target.value as ProfileValues["ageGroup"], { shouldDirty: true, shouldValidate: true })}>
            <option value="child">Trẻ em</option>
            <option value="teen">Thiếu niên</option>
            <option value="adult">Người trưởng thành</option>
            <option value="senior">Người lớn tuổi</option>
          </Select>
        </div>
        <details className="optional-details">
          <summary>Thông tin trường lớp (tùy chọn)</summary>
          <div className="settings-form-grid">
            <Input label="Trường" {...register("school")} />
            <Input label="Chuyên ngành" {...register("major")} />
          </div>
          <Input
            label="Năm học bắt đầu"
            type="number"
            min="1900"
            max="2200"
            {...register("courseYear")}
          />
        </details>
        <div className="settings-form-grid">
          <Select customMenu label="Ngôn ngữ" value={watch("language")} onChange={(event) => setValue("language", event.target.value as ProfileValues["language"], { shouldDirty: true, shouldValidate: true })}>
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </Select>
          <Select customMenu label="Múi giờ" value={watch("timezone")} onChange={(event) => setValue("timezone", event.target.value, { shouldDirty: true, shouldValidate: true })}>
            <option value="Asia/Ho_Chi_Minh">UTC+07:00 Hồ Chí Minh</option>
            <option value="Asia/Bangkok">UTC+07:00 Bangkok</option>
            <option value="Asia/Tokyo">UTC+09:00 Tokyo</option>
            <option value="Europe/London">UTC+00:00 London</option>
            <option value="America/New_York">UTC-05:00 New York</option>
          </Select>
        </div>
        <div className="settings-actions">
          <span className="subtle">
            {isDirty ? "Bạn có thay đổi chưa lưu" : "Thông tin đã được lưu"}
          </span>
          <div className="settings-actions-buttons">
            {hasChanges && <Button type="button" variant="secondary" onClick={() => { reset(initialValues.current); setCropFile(null); setPreview(""); }}>Hủy</Button>}
            <Button type="submit" loading={update.isPending}>
              <Save size={16} /> Lưu thay đổi
            </Button>
          </div>
        </div>
      </form>
      </SettingsSection>
    </>
  );
}

function SecuritySettings() {
  const mutation = useUpdatePasswordMutation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    mode: "onChange",
  });
  const submit = (values: PasswordValues) =>
    mutation.mutate(
      {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      },
      {
        onSuccess: () => {
          reset();
          toast.success("Đã đổi mật khẩu");
        },
        onError: (error) =>
          toast.error(
            getApiErrorMessage(error, "Mật khẩu hiện tại không đúng"),
          ),
      },
    );
  return (
    <SettingsSection
      icon={<KeyRound size={18} />}
      title="Bảo mật tài khoản"
      description="Đổi mật khẩu định kỳ để giữ tài khoản của bạn an toàn."
    >
      <form
        className="settings-form narrow-form"
        onSubmit={handleSubmit(submit)}
        noValidate
      >
        <Input
          label="Mật khẩu hiện tại"
          type="password"
          error={errors.currentPassword?.message}
          {...register("currentPassword")}
        />
        <Input
          label="Mật khẩu mới"
          type="password"
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />
        <Input
          label="Nhập lại mật khẩu mới"
          type="password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <div className="settings-actions">
          <span />{" "}
          <Button type="submit" loading={mutation.isPending}>
            Cập nhật mật khẩu
          </Button>
        </div>
      </form>
    </SettingsSection>
  );
}

function AppearanceSettings() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">(
    (localStorage.getItem("studyflow_theme") as "light" | "dark" | "system") ||
      "light",
  );
  const apply = (next: "light" | "dark" | "system") => {
    setTheme(next);
    localStorage.setItem("studyflow_theme", next);
    const dark =
      next === "dark" ||
      (next === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    toast.success("Đã cập nhật giao diện");
  };
  return (
    <SettingsSection
      icon={<SlidersHorizontal size={18} />}
      title="Giao diện và ngôn ngữ"
      description="Chọn cách StudyFlow xuất hiện trong những phiên học dài."
    >
      <div className="appearance-option">
        <div>
          <strong>Chế độ màu</strong>
          <p className="subtle">Thay đổi ngay, lưu trên thiết bị này.</p>
        </div>
        <Select
          customMenu
          value={theme}
          onChange={(event) => apply(event.target.value as typeof theme)}
        >
          <option value="light">Sáng</option>
          <option value="dark">Tối</option>
          <option value="system">Theo hệ thống</option>
        </Select>
      </div>
      <div className="appearance-preview">
        <div className="preview-bar" />
        <div className="preview-body">
          <span />
          <span />
          <span />
        </div>
        <Badge tone={theme === "dark" ? "violet" : "blue"}>
          {theme === "dark" ? "Focus mode" : "Clear workspace"}
        </Badge>
      </div>
    </SettingsSection>
  );
}

function NotificationSettings() {
  const query = useNotificationSettingsQuery();
  const mutation = useUpdateNotificationSettingsMutation();
  const [settings, setSettings] = useState({
    reminderMinutesBefore: 30,
    emailEnabled: true,
    pushEnabled: false,
    inAppEnabled: true,
  });
  useEffect(() => {
    if (query.data) setSettings(query.data);
  }, [query.data]);
  const save = (input: Partial<typeof settings>) => {
    const next = { ...settings, ...input };
    setSettings(next);
    mutation.mutate(input, {
      onSuccess: () => toast.success("Đã lưu tùy chọn nhắc nhở"),
      onError: (error) => {
        setSettings(settings);
        toast.error(getApiErrorMessage(error, "Không thể lưu nhắc nhở"));
      },
    });
  };
  return (
    <SettingsSection
      icon={<SlidersHorizontal size={18} />}
      title="Nhắc nhở"
      description="Chọn cách StudyFlow nhắc bạn về công việc và lịch học."
    >
      <div className="notification-settings">
        <Switch
          label="Thông báo trong ứng dụng"
          checked={settings.inAppEnabled}
          disabled={mutation.isPending}
          onChange={(event) => save({ inAppEnabled: event.target.checked })}
        />
        <Switch
          label="Email nhắc nhở"
          checked={settings.emailEnabled}
          disabled={mutation.isPending}
          onChange={(event) => save({ emailEnabled: event.target.checked })}
        />
        <Switch
          label="Thông báo trình duyệt"
          checked={settings.pushEnabled}
          disabled={mutation.isPending}
          onChange={async (event) => { if (event.target.checked && 'Notification' in window && Notification.permission === 'default') { const permission = await Notification.requestPermission(); if (permission !== 'granted') { toast.error('Bạn chưa cấp quyền thông báo trình duyệt'); return } } if (event.target.checked && 'Notification' in window && Notification.permission === 'denied') { toast.error('Thông báo trình duyệt đang bị chặn trong cài đặt trình duyệt'); return } save({ pushEnabled: event.target.checked }) }}
        />
      </div>
      <div className="reminder-row">
        <strong>Nhắc trước deadline</strong>
        <Select
          customMenu
          value={settings.reminderMinutesBefore}
          disabled={mutation.isPending}
          onChange={(event) =>
            save({ reminderMinutesBefore: Number(event.target.value) })
          }
        >
          <option value={0}>Đúng thời điểm</option>
          <option value={15}>15 phút</option>
          <option value={30}>30 phút</option>
          <option value={60}>1 giờ</option>
          <option value={1440}>1 ngày</option>
        </Select>
      </div>
    </SettingsSection>
  );
}
function SettingsSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <article className="settings-section">
      <header className="settings-section-head">
        <span className="settings-icon">{icon}</span>
        <div>
          <h2>{title}</h2>
          <p className="subtle">{description}</p>
        </div>
      </header>
      {children}
    </article>
  );
}
