import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Smartphone, Trash2, RefreshCw, Eye, EyeOff, CheckCircle, AlertCircle, WifiOff } from 'lucide-react';
import { devicesApi, authApi, type Device } from '@/lib/api';

type LoadingState = 'loading' | 'success' | 'error' | 'empty';

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
  const [state, setState] = useState<LoadingState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const fetchDevices = async () => {
    setState('loading');
    setErrorMessage('');
    
    try {
      const result = await devicesApi.getAll();
      
      if (result.success) {
        setDevices(result.data || []);
        setState((result.data && result.data.length > 0) ? 'success' : 'empty');
      } else {
        setErrorMessage(result.error as string || 'فشل في جلب البيانات من الخادم');
        setState('error');
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
      setErrorMessage('فشل الاتصال بالخادم. تأكد من اتصالك بالإنترنت.');
      setState('error');
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleDeleteDevice = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الجهاز؟')) return;
    
    try {
      const result = await devicesApi.delete(id);
      if (result.success) {
        await fetchDevices();
      } else {
        alert(result.error || 'فشل في حذف الجهاز');
      }
    } catch (error) {
      alert('فشل في الاتصال بالخادم');
    }
  };

  const handleLogoutAll = async () => {
    if (!confirm('هل أنت متأكد من تسجيل الخروج من جميع الأجهزة؟')) return;
    
    try {
      const result = await devicesApi.deleteAll();
      if (result.success) {
        setDevices([]);
        setState('empty');
      } else {
        alert(result.error || 'فشل في تسجيل الخروج');
      }
    } catch (error) {
      alert('فشل في الاتصال بالخادم');
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
    
    try {
      const result = await authApi.changePassword(currentPassword, newPassword);

      if (result.success) {
        setPasswordSuccess(result.message || 'تم تغيير كلمة المرور بنجاح');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(result.error as string || 'فشل في تغيير كلمة المرور');
      }
    } catch (error) {
      console.error('Password change error:', error);
      setPasswordError('فشل الاتصال بالخادم. تأكد من اتصالك بالإنترنت.');
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
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <Button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="w-full md:w-auto bg-[#0a4fa3] hover:bg-[#073a7a]"
              >
                {isChangingPassword ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin ml-2"></div>
                    جارٍ التغيير...
                  </>
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
              {state === 'success' && devices.length > 0 && (
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
            {/* Loading State */}
            {state === 'loading' && (
              <div className="py-12 text-center">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-muted-foreground text-sm">جارٍ جلب الأجهزة...</p>
              </div>
            )}

            {/* Error State */}
            {state === 'error' && (
              <div className="py-8 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <WifiOff className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-sm font-bold text-red-600 mb-1">فشل في جلب الأجهزة</h3>
                <p className="text-xs text-red-500/80 mb-3">{errorMessage}</p>
                <Button onClick={fetchDevices} size="sm" className="gap-2 bg-red-500 hover:bg-red-600">
                  <RefreshCw className="w-3 h-3" />
                  إعادة المحاولة
                </Button>
              </div>
            )}

            {/* Empty State */}
            {state === 'empty' && (
              <div className="py-8 text-center">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <Smartphone className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">لا توجد أجهزة موثوقة</p>
                <p className="text-xs text-muted-foreground/70 mt-1">ستظهر الأجهزة هنا عند تسجيل الدخول</p>
              </div>
            )}

            {/* Devices List */}
            {state === 'success' && devices.length > 0 && (
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
