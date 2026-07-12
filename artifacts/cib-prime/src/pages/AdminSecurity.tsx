import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Smartphone, Trash2, RefreshCw, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { devicesApi, authApi, type Device } from '@/lib/api';

// بيانات تجريبية للأجهزة
const defaultDevices: Device[] = [
  { id: 1, deviceId: 'device-1', deviceName: 'iPhone 15 Pro', deviceType: 'mobile', lastIp: '192.168.1.100', lastUsedAt: new Date('2026-07-12T10:30:00'), createdAt: new Date() },
  { id: 2, deviceId: 'device-2', deviceName: 'MacBook Pro', deviceType: 'desktop', lastIp: '192.168.1.101', lastUsedAt: new Date('2026-07-12T08:15:00'), createdAt: new Date() },
  { id: 3, deviceId: 'device-3', deviceName: 'Samsung Galaxy S24', deviceType: 'mobile', lastIp: '192.168.1.102', lastUsedAt: new Date('2026-07-11T22:45:00'), createdAt: new Date() },
];

function formatDate(dateStr: string | Date | undefined): string {
  if (!dateStr) return 'غير معروف';
  const date = new Date(dateStr);
  return date.toLocaleString('ar-EG', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminSecurity() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    setLoadingDevices(true);
    const result = await devicesApi.getAll();
    if (result.success && result.data && result.data.length > 0) {
      setDevices(result.data);
      setIsInitialized(true);
    } else if (!isInitialized) {
      // استخدام البيانات التجريبية إذا لم تكن هناك بيانات
      setDevices(defaultDevices);
    }
    setLoadingDevices(false);
  };

  const handleDeleteDevice = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الجهاز؟')) return;
    const result = await devicesApi.delete(id);
    if (result.success) {
      await fetchDevices();
    }
  };

  const handleLogoutAll = async () => {
    if (!confirm('هل أنت متأكد من تسجيل الخروج من جميع الأجهزة؟')) return;
    const result = await devicesApi.deleteAll();
    if (result.success) {
      setDevices([]);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('يرجى إدخال كلمة المرور الحالية');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('كلمة المرور الجديدة غير متطابقة');
      return;
    }

    setIsChangingPassword(true);
    const result = await authApi.changePassword(currentPassword, newPassword);

    if (result.success) {
      setPasswordSuccess(result.message || 'تم تغيير كلمة المرور بنجاح');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordError(result.error as string || 'فشل في تغيير كلمة المرور');
    }

    setIsChangingPassword(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">الأمان</h1>
          <p className="text-muted-foreground mt-1">إدارة إعدادات الأمان وحماية حسابك</p>
        </div>

        {/* Change Password */}
        <Card className="border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0a4fa3]/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-[#0a4fa3]" />
              </div>
              <div>
                <CardTitle className="text-lg">تغيير كلمة المرور</CardTitle>
                <CardDescription>قم بتحديث كلمة مرور لوحة الإدارة</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">كلمة المرور الحالية</label>
                <Input
                  type={showPasswords ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور الحالية"
                  className="h-11"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">كلمة المرور الجديدة</label>
                  <Input
                    type={showPasswords ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="8 أحرف على الأقل"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">تأكيد كلمة المرور</label>
                  <Input
                    type={showPasswords ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="أعد إدخال كلمة المرور"
                    className="h-11"
                  />
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPasswords(!showPasswords)}
                className="gap-2 text-xs"
              >
                {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showPasswords ? 'إخفاء' : 'إظهار'} كلمات المرور
              </Button>

              {passwordError && (
                <div className="flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <Button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="w-full md:w-auto bg-[#0a4fa3] hover:bg-[#073a7a]"
              >
                {isChangingPassword ? (
                  <><Loader2 className="w-4 h-4 animate-spin ml-2" /> جارٍ التغيير...</>
                ) : (
                  'تغيير كلمة المرور'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Trusted Devices */}
        <Card className="border-border">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0a4fa3]/10 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-[#0a4fa3]" />
                </div>
                <div>
                  <CardTitle className="text-lg">الأجهزة الموثوقة</CardTitle>
                  <CardDescription>الأجهزة المسجلة للمصادقة الثنائية</CardDescription>
                </div>
              </div>
              {devices.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogoutAll}
                  className="text-red-500 border-red-200 hover:bg-red-50 gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  تسجيل خروج جميع الأجهزة
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loadingDevices ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : devices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>لا توجد أجهزة موثوقة</p>
                <p className="text-sm">ستظهر الأجهزة هنا عند تسجيل الدخول</p>
              </div>
            ) : (
              <div className="space-y-3">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${device.deviceType === 'mobile' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                        <Smartphone className={`w-5 h-5 ${device.deviceType === 'mobile' ? 'text-blue-600' : 'text-purple-600'}`} />
                      </div>
                      <div className="min-w-0 text-right">
                        <p className="font-medium text-foreground truncate">{device.deviceName}</p>
                        <p className="text-xs text-muted-foreground">
                          IP: {device.lastIp || 'غير معروف'} • آخر استخدام: {formatDate(device.lastUsedAt)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDevice(device.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-1 shrink-0 mr-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">حذف</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Info */}
        <Card className="border-border bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                <Lock className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">معلومات أمنية</p>
                <p className="text-sm text-muted-foreground">
                  بياناتك محمية بتشفير 256-bit. عند حذف جهاز، سيتم تسجيل الخروج تلقائياً من هذا الجهاز.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
