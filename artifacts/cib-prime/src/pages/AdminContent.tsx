import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Image, Check, X, Save, AlertCircle, Loader2 } from 'lucide-react';
import { watchesApi, type Watch } from '@/lib/api';

interface WatchFormData {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  colorId: string;
  colorName: string;
  colorHex: string;
  imageUrl: string;
  isActive: boolean;
}

export default function AdminContent() {
  const [watches, setWatches] = useState<Watch[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingWatch, setEditingWatch] = useState<Watch | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState<WatchFormData>({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    colorId: '',
    colorName: '',
    colorHex: '#000000',
    imageUrl: '',
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch watches on mount
  useEffect(() => {
    fetchWatches();
  }, []);

  const fetchWatches = async () => {
    setLoading(true);
    const result = await watchesApi.getAll();
    if (result.success && result.data) {
      setWatches(result.data);
    }
    setLoading(false);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'اسم المنتج مطلوب';
    if (!formData.nameAr.trim()) newErrors.nameAr = 'اسم المنتج بالعربية مطلوب';
    if (!formData.colorId.trim()) newErrors.colorId = 'معرف اللون مطلوب';
    if (!formData.colorName.trim()) newErrors.colorName = 'اسم اللون مطلوب';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);

    const result = editingWatch
      ? await watchesApi.update(editingWatch.id, formData)
      : await watchesApi.create(formData);

    if (result.success) {
      await fetchWatches();
      closeDialog();
    }

    setSaving(false);
  };

  const handleEdit = (watch: Watch) => {
    setEditingWatch(watch);
    setFormData({
      name: watch.name,
      nameAr: watch.nameAr,
      description: watch.description || '',
      descriptionAr: watch.descriptionAr || '',
      colorId: watch.colorId,
      colorName: watch.colorName,
      colorHex: watch.colorHex || '#000000',
      imageUrl: watch.imageUrl || '',
      isActive: watch.isActive,
    });
    setErrors({});
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه الساعة؟')) return;
    const result = await watchesApi.delete(id);
    if (result.success) {
      await fetchWatches();
    }
  };

  const handleToggleActive = async (id: number) => {
    const result = await watchesApi.toggle(id);
    if (result.success) {
      await fetchWatches();
    }
  };

  const closeDialog = () => {
    setEditingWatch(null);
    setIsAddingNew(false);
    setFormData({ name: '', nameAr: '', description: '', descriptionAr: '', colorId: '', colorName: '', colorHex: '#000000', imageUrl: '', isActive: true });
    setErrors({});
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">إعدادات المحتوى</h1>
            <p className="text-muted-foreground mt-1">إدارة الساعات الذكية والصور</p>
          </div>
          <Button onClick={() => setIsAddingNew(true)} className="gap-2 bg-[#0a4fa3] hover:bg-[#073a7a]">
            <Plus className="w-4 h-4" />
            إضافة ساعة جديدة
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-border">
            <CardContent className="pt-4">
              <div className="text-2xl md:text-3xl font-bold text-[#0a4fa3]">{watches.length}</div>
              <p className="text-xs md:text-sm text-muted-foreground">إجمالي الساعات</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-4">
              <div className="text-2xl md:text-3xl font-bold text-green-600">{watches.filter(w => w.isActive).length}</div>
              <p className="text-xs md:text-sm text-muted-foreground">نشطة</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-4">
              <div className="text-2xl md:text-3xl font-bold text-red-500">{watches.filter(w => !w.isActive).length}</div>
              <p className="text-xs md:text-sm text-muted-foreground">غير نشطة</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-4">
              <div className="text-2xl md:text-3xl font-bold text-purple-600">{new Set(watches.map(w => w.colorId)).size}</div>
              <p className="text-xs md:text-sm text-muted-foreground">الألوان</p>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : watches.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Image className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium text-foreground">لا توجد ساعات</p>
              <p className="text-sm text-muted-foreground mt-1">أضف ساعة جديدة للبدء</p>
            </CardContent>
          </Card>
        ) : (
          /* Watches Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {watches.map((watch) => (
              <Card key={watch.id} className={`border-border overflow-hidden transition-all ${!watch.isActive ? 'opacity-60' : ''}`}>
                <div className="relative h-40 bg-gradient-to-br from-gray-50 to-gray-100">
                  {watch.imageUrl ? (
                    <img src={watch.imageUrl} alt={watch.nameAr} className="w-full h-full object-contain p-4" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground/50">
                      <Image className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <div className="w-8 h-8 rounded-full border-2 border-white shadow-md" style={{ backgroundColor: watch.colorHex || '#000' }} />
                  </div>
                  {!watch.isActive && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full">غير نشط</span>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-foreground mb-1 text-sm md:text-base">{watch.nameAr}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{watch.colorName}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleToggleActive(watch.id)} className={`flex-1 h-8 text-xs gap-1 ${watch.isActive ? 'text-green-600 border-green-200' : 'text-gray-400'}`}>
                      {watch.isActive ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {watch.isActive ? 'نشط' : 'إيقاف'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(watch)} className="h-8 px-2"><Edit2 className="w-4 h-4 text-blue-600" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(watch.id)} className="h-8 px-2"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit/Add Dialog */}
        {(editingWatch || isAddingNew) && (
          <Dialog open onOpenChange={closeDialog}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
              <DialogHeader>
                <DialogTitle>{editingWatch ? 'تعديل الساعة' : 'إضافة ساعة جديدة'}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Preview */}
                <div className="relative h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden">
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-contain p-4" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground"><Image className="w-12 h-12 opacity-50" /></div>
                  )}
                </div>

                {/* Image URL */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">رابط الصورة</label>
                  <Input value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} placeholder="https://..." />
                </div>

                {/* Names */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">الاسم بالإنجليزية *</label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Aurora Watch" />
                    {errors.name && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">الاسم بالعربية *</label>
                    <Input value={formData.nameAr} onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })} placeholder="ساعة اورورا" />
                    {errors.nameAr && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.nameAr}</p>}
                  </div>
                </div>

                {/* Descriptions */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">الوصف بالإنجليزية</label>
                  <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Elegant smart watch with modern design" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">الوصف بالعربية</label>
                  <Input value={formData.descriptionAr} onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })} placeholder="ساعة ذكية أنيقة بتصميم عصري" />
                </div>

                {/* Color */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">معرف اللون *</label>
                    <Input value={formData.colorId} onChange={(e) => setFormData({ ...formData, colorId: e.target.value.toLowerCase() })} placeholder="purple" />
                    {errors.colorId && <p className="text-xs text-red-500">{errors.colorId}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">اسم اللون *</label>
                    <Input value={formData.colorName} onChange={(e) => setFormData({ ...formData, colorName: e.target.value })} placeholder="بنفسجي" />
                    {errors.colorName && <p className="text-xs text-red-500">{errors.colorName}</p>}
                  </div>
                </div>

                {/* Color Hex */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">كود اللون (Hex) *</label>
                  <div className="flex gap-2">
                    <input type="color" value={formData.colorHex} onChange={(e) => setFormData({ ...formData, colorHex: e.target.value })} className="w-12 h-11 rounded-lg border border-border cursor-pointer" />
                    <Input value={formData.colorHex} onChange={(e) => setFormData({ ...formData, colorHex: e.target.value })} placeholder="#9333ea" className="flex-1 font-mono" />
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setFormData({ ...formData, isActive: !formData.isActive })} className={`relative w-12 h-6 rounded-full transition-colors ${formData.isActive ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.isActive ? 'right-1' : 'left-1'}`} />
                  </button>
                  <span className="text-sm text-foreground">{formData.isActive ? 'نشط' : 'غير نشط'}</span>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={closeDialog}>إلغاء</Button>
                <Button onClick={handleSave} disabled={saving} className="gap-2 bg-[#0a4fa3] hover:bg-[#073a7a]">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ الحفظ...</> : <><Save className="w-4 h-4" /> {editingWatch ? 'حفظ التغييرات' : 'إضافة'}</>}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminLayout>
  );
}
