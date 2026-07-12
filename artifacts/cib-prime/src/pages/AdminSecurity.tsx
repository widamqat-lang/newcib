import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Smartphone, Trash2, RefreshCw, Eye, EyeOff, CheckCircle, AlertCircle, WifiOff, LogOut } from 'lucide-react';
import { devicesApi, authApi, type Device } from '@/lib/api';

type LoadingState = 'loading' | 'success' | 'error' | 'empty';

function formatDate(dateStr: string | Date | undefined): string {
  if (!dateStr) return 'غير معروف';
  const date = new Date(dateStr);
  return date.toLocaleString('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Navigate to login
function navigateToLogin() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_device_id');
  localStorage.removeItem('admin_logged_in');
  window.location.href = '/admin';
}

// Get current device ID
function getCurrentDeviceId(): string | null {
  return localStorage.getItem('admin_device_id');
}

// Translate device name to Arabic
function translateDeviceName(name: string): string {
  if (name.includes('Mobile')) return 'هاتف محمول';
  if (name.includes('Tablet')) return 'جهاز لوحي';
  if (name.includes('Desktop')) return 'كمبيوتر';
  return name;
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
        // No auto-seeding - just show empty state
        if (!result.data || result.data.length === 0) {
          setDevices([]);
          setState('empty');
        } else {
          setDevices(result.data);
          setState('success');
        }
      } else {
        setErrorMessage(String(result.error) || 'فشل في جلب البيانات من الخادم');
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

  const handleDeleteDevice = async (device: Device) => {
    const currentDeviceId = getCurrentDeviceId();
    const isCurrentDevice = currentDeviceId === device.deviceId;
    
    const message = isCurrentDevice 
      ? 'هل أنت متأكد من حذف جهازك الحالي؟ سيتم تسجيل خروجك من لوحة الإدارة.'
      : 'هل أنت متأكد من حذف هذا الجهاز؟ سيتم تسجيل الخروج من هذا الجهاز.';
    
    if (!confirm(message)) return;
    
    try {
      // Delete device from database
      const result = await devicesApi.delete(device.id);
      if (result.success) {
        // If deleting current device, redirect to login
        if (isCurrentDevice) {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_device_id');
          localStorage.removeItem('admin_logged_in');
          alert('تم حذف جهازك وتسجيل خروجك');
          window.location.href = '/admin';
          return;
        }
        await fetchDevices();
        alert('تم حذف الجهاز');
      } else {
        alert(String(result.error) || 'فشل في حذف الجهاز');
      }
    } catch { 
      alert('فشل في الاتصال بالخادم'); 
    }
  };

  const handleLogoutAll = async () => {
    if (!confirm('هل أنت متأكد من تسجيل الخروج من جميع الأجهزة؟ سيتم تسجيل الخروج من جميع الأجهزة.')) return;
    
    try {
      // Delete all devices from database first
      const deleteResult = await devicesApi.deleteAll();
      if (!deleteResult.success) {
        alert(String(deleteResult.error) || 'فشل في حذف الأجهزة');
        return;
      }
      
      // Then call logout-all to clear sessions
      const result = await authApi.logoutAll();
      if (result.success) {
        setDevices([]);
        setState('empty');
        alert('تم تسجيل الخروج من جميع الأجهزة بنجاح');
      } else {
        alert(String(result.error) || 'فشل في إنهاء الجلسات');
      }
    } catch { 
      alert('فشل في الاتصال بالخادم'); 
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) { setPasswordError('يرجى إدخال كلمة المرور الحالية'); return; }
    if (newPassword.length < 8) { setPasswordError('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('كلمة المرور الجديدة غير متطابقة'); return; }

    setIsChangingPassword(true);
    
    try {
      const result = await authApi.changePassword(currentPassword, newPassword);
      if (result.success) {
        setPasswordSuccess(result.message || 'تم تغيير كلمة المرور بنجاح');
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        
        // After password change, logout all devices
        await authApi.logoutAll();
        setDevices([]);
        setState('empty');
      } else {
        setPasswordError(String(result.error) || 'فشل في تغيير كلمة المرور');
      }
    } catch (error) {
      console.error('Password change error:', error);
      setPasswordError('فشل الاتصال بالخادم. تأكد من اتصالك بالإنترنت.');
    }

    setIsChangingPassword(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 max-w-4xl px-1 sm:px-0">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">الأمان</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">إدارة إعدادات الأمان وحماية حسابك</p>
        </div>

        {/* Change Password */}
        <Card className="border-border">
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0a4fa3]/10 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-[#0a4fa3]" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base sm:text-lg">تغيير كلمة المرور</CardTitle>
                <CardDescription className="text-xs sm:text-sm">قم بتحديث كلمة مرور لوحة الإدارة</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-foreground">كلمة المرور الحالية</label>
                <Input type={showPasswords ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="أدخل كلمة المرور الحالية" className="h-10 sm:h-11" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-foreground">كلمة المرور الجديدة</label>
                  <Input type={showPasswords ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="8 أحرف على الأقل" className="h-10 sm:h-11" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-foreground">تأكيد كلمة المرور</label>
                  <Input type={showPasswords ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="أعد الإدخال" className="h-10 sm:h-11" />
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowPasswords(!showPasswords)} className="gap-1.5 sm:gap-2 text-xs w-full sm:w-auto justify-center">
                {showPasswords ? <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" /> : <Eye className="w-3 h-3 sm:w-4 sm:h-4" />}
                {showPasswords ? 'إخفاء' : 'إظهار'}
              </Button>

              {passwordError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3 flex items-center gap-2 text-red-600 text-xs sm:text-sm">
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" /><span>{passwordError}</span>
                </div>
              )}
              {passwordSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3 flex items-center gap-2 text-green-600 text-xs sm:text-sm">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" /><span>{passwordSuccess}</span>
                </div>
              )}
              <Button onClick={handleChangePassword} disabled={isChangingPassword} className="w-full sm:w-auto bg-[#0a4fa3] hover:bg-[#073a7a]">
                {isChangingPassword ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin ml-2"></div> جارٍ التغيير...</> : 'تغيير كلمة المرور'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Trusted Devices */}
        <Card className="border-border">
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0a4fa3]/10 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5 text-[#0a4fa3]" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base sm:text-lg">الأجهزة الموثوقة</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">الأجهزة المسجلة للدخول</CardDescription>
                </div>
              </div>
              {state === 'success' && devices.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleLogoutAll} className="text-red-500 border-red-200 hover:bg-red-50 gap-2 w-full sm:w-auto justify-center">
                  <RefreshCw className="w-4 h-4" /> تسجيل خروج جميع الأجهزة
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {state === 'loading' && (
              <div className="py-8 sm:py-12 text-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-muted-foreground text-sm">جارٍ جلب الأجهزة...</p>
              </div>
            )}

            {state === 'error' && (
              <div className="py-6 sm:py-8 text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <WifiOff className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                </div>
                <h3 className="text-sm font-bold text-red-600 mb-1">فشل في جلب الأجهزة</h3>
                <p className="text-xs text-red-500/80 mb-3">{errorMessage}</p>
                <Button onClick={fetchDevices} size="sm" className="gap-2 bg-red-500 hover:bg-red-600">
                  <RefreshCw className="w-3 h-3" /> إعادة المحاولة
                </Button>
              </div>
            )}

            {state === 'empty' && (
              <div className="py-6 sm:py-8 text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">لا توجد أجهزة موثوقة</p>
                <p className="text-xs text-muted-foreground/70 mt-1">ستظهر الأجهزة هنا عند تسجيل الدخول</p>
                <p className="text-xs text-green-600/70 mt-2">جهازك الحالي: <span className="font-medium">{translateDeviceName(navigator.userAgent.includes('Mobile') ? 'Mobile Phone' : 'Desktop Computer')}</span></p>
              </div>
            )}

            {state === 'success' && devices.length > 0 && (
              <div className="space-y-2 sm:space-y-3">
                {devices.map((device) => {
                  const isCurrentDevice = getCurrentDeviceId() === device.deviceId;
                  const displayName = translateDeviceName(device.deviceName);
                  return (
                    <div key={device.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors gap-3 ${isCurrentDevice ? 'border-green-500/50 ring-1 ring-green-500/20' : 'border-border'}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${device.deviceType === 'mobile' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                          <Smartphone className={`w-4 h-4 sm:w-5 sm:h-5 ${device.deviceType === 'mobile' ? 'text-blue-600' : 'text-purple-600'}`} />
                        </div>
                        <div className="min-w-0 text-right flex-1">
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                            <p className="font-medium text-foreground text-sm sm:text-base truncate">{displayName}</p>
                            {isCurrentDevice && (
                              <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs bg-green-100 text-green-700 rounded-full whitespace-nowrap">الجهاز الحالي</span>
                            )}
                          </div>
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">IP: {device.lastIp || 'غير معروف'}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">آخر استخدام: {formatDate(device.lastUsedAt)}</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteDevice(device)} 
                        className={`gap-1 w-full sm:w-auto justify-center ${isCurrentDevice ? 'text-orange-500 hover:text-orange-600 hover:bg-orange-50' : 'text-red-500 hover:text-red-600 hover:bg-red-50'}`}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-xs sm:text-sm">{isCurrentDevice ? 'حذف جهازي' : 'حذف'}</span>
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-blue-50/50">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-foreground mb-1 text-sm sm:text-base">معلومات أمنية</p>
                <p className="text-xs sm:text-sm text-muted-foreground">بياناتك محمية بتشفير 256-bit. عند حذف جهاز، سيتم تسجيل الخروج تلقائياً من هذا الجهاز.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
