import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Loader2, Image as ImageIcon, AlertCircle } from "lucide-react";
import api from "../../api/axios";
import Toast from "../../components/shared/Toast";

interface GlobalColor {
    id: string;
    name: string;
    hex: string;
    mockupUrl: string;
    createdAt: string;
}

export default function AdminColors() {
    const [colors, setColors] = useState<GlobalColor[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    // Form states
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newColorName, setNewColorName] = useState("");
    const [newColorHex, setNewColorHex] = useState("#000000");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchColors = async () => {
        try {
            const res = await api.get("/api/colors");
            setColors(res.data.data.colors);
        } catch (err) {
            console.error(err);
            setToast({ message: "Failed to load global colors", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchColors();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleAddColor = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!newColorName.trim() || !newColorHex || !selectedFile) {
            setToast({ message: "Please fill all fields and select a mockup file.", type: "error" });
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append("name", newColorName.trim());
        formData.append("hex", newColorHex);
        formData.append("mockup", selectedFile);

        try {
            await api.post("/api/colors", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setToast({ message: "Color successfully added to matrix", type: "success" });
            
            // Reset form
            setNewColorName("");
            setNewColorHex("#000000");
            setSelectedFile(null);
            setPreviewUrl(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            
            fetchColors();
        } catch (err: any) {
            setToast({ message: err.response?.data?.message || "Failed to add color", type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteColor = async (id: string) => {
        if (!confirm("Are you sure you want to completely erase this global color? Products using this color might lose their references.")) return;
        
        try {
            await api.delete(`/api/colors/${id}`);
            setToast({ message: "Color deleted successfully", type: "success" });
            setColors(colors.filter(c => c.id !== id));
        } catch (err) {
            setToast({ message: "Failed to delete color", type: "error" });
        }
    };

    return (
        <div className="w-full min-h-screen bg-neutral-g1 flex flex-col pt-4 text-neutral-black">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <div className="flex-1 px-4 sm:px-8 pb-12 w-full max-w-7xl mx-auto space-y-8">
                {/* Header Subtext */}
                <div>
                    <p className="font-display text-[12px] font-black uppercase tracking-[1px] text-neutral-g4 mb-4 pb-4 border-b-[2px] border-neutral-black/10">
                        Define global blank mockups and colors for artists to select from during product generation.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Add New Color Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white border-[2px] border-neutral-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-[4px] p-6 sticky top-24">
                            <h3 className="font-display text-[16px] font-black uppercase tracking-[2px] mb-6 border-b-[2px] border-neutral-black pb-2">Inject New Color</h3>
                            
                            <form onSubmit={handleAddColor} className="space-y-5">
                                <div>
                                    <label className="block font-display text-[10px] font-black uppercase tracking-[1px] mb-2">Color Label</label>
                                    <input 
                                        type="text" 
                                        value={newColorName}
                                        onChange={(e) => setNewColorName(e.target.value)}
                                        placeholder="E.g. Midnight Navy" 
                                        maxLength={40}
                                        className="w-full p-3 font-display text-[12px] font-bold uppercase tracking-wider bg-neutral-g1 border-[2px] border-neutral-black rounded-[2px] focus:outline-none focus:bg-white transition-colors"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block font-display text-[10px] font-black uppercase tracking-[1px] mb-2">Hex Signature</label>
                                    <div className="flex items-center gap-3 w-full p-2 bg-neutral-g1 border-[2px] border-neutral-black rounded-[2px]">
                                        <input 
                                            type="color" 
                                            value={newColorHex}
                                            onChange={(e) => setNewColorHex(e.target.value)}
                                            className="w-10 h-10 border-0 bg-transparent p-0 cursor-pointer rounded-[2px] shrink-0"
                                        />
                                        <input 
                                            type="text"
                                            value={newColorHex}
                                            onChange={(e) => setNewColorHex(e.target.value)}
                                            className="flex-1 bg-transparent border-none focus:outline-none font-display text-[14px] font-black uppercase tracking-widest"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-display text-[10px] font-black uppercase tracking-[1px] mb-2">Blank Mockup Upload</label>
                                    <div className="border-[2px] border-dashed border-neutral-black/50 rounded-[2px] p-4 text-center relative overflow-hidden group cursor-pointer hover:bg-neutral-g1 transition-colors">
                                        <input 
                                            ref={fileInputRef}
                                            type="file" 
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        
                                        {previewUrl ? (
                                            <div className="relative w-full aspect-square border-[2px] border-neutral-black bg-white flex items-center justify-center">
                                                <img src={previewUrl} alt="Preview" className="w-[90%] h-[90%] object-contain" />
                                            </div>
                                        ) : (
                                            <div className="py-8 flex flex-col items-center justify-center pointer-events-none">
                                                <ImageIcon className="w-8 h-8 text-neutral-g4 mb-3 group-hover:text-primary group-hover:scale-110 transition-all" />
                                                <p className="font-display text-[10px] font-black uppercase tracking-[1px]">Click to Select Image</p>
                                                <p className="font-display text-[8px] font-bold text-neutral-g4 uppercase mt-1">High-res Blank Garment Only</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button 
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`w-full py-4 bg-primary text-neutral-black border-[2px] border-neutral-black font-display text-[13px] font-black uppercase tracking-[2px] rounded-[2px] flex items-center justify-center gap-2 transition-all ${isSubmitting ? "opacity-70 cursor-wait" : "hover:bg-primary-dark shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-y-[-2px] hover:translate-y-0 translate-x-[-2px] hover:translate-x-0 active:translate-y-0.5 active:translate-x-0.5"}`}
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /> Mount Color</>}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Active Colors Table */}
                    <div className="lg:col-span-2">
                        <div className="bg-white border-[2px] border-neutral-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-[4px] overflow-hidden">
                            <div className="p-6 border-b-[2px] border-neutral-black bg-neutral-black text-white flex justify-between items-center">
                                <h3 className="font-display text-[16px] font-black uppercase tracking-[2px]">Global Color Matrix</h3>
                                <div className="font-display text-[10px] font-black uppercase bg-white/20 px-3 py-1 rounded-[2px] tracking-[1px]">
                                    {colors.length} Entries Registered
                                </div>
                            </div>
                            
                            <div className="overflow-x-auto min-h-[400px]">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center h-64 text-neutral-g4">
                                        <Loader2 className="w-8 h-8 animate-spin mb-4" />
                                        <p className="font-display text-[10px] font-black uppercase tracking-[2px]">Fetching Master List...</p>
                                    </div>
                                ) : colors.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-64 text-neutral-g4 bg-neutral-g1 m-8 border-[2px] border-dashed border-neutral-black/20 text-center p-6">
                                        <AlertCircle className="w-10 h-10 mb-4 opacity-50" />
                                        <p className="font-display text-[12px] font-black uppercase tracking-[1px] text-neutral-black">Matrix is Empty</p>
                                        <p className="font-display text-[10px] font-bold uppercase mt-2">Inject your first blank color to begin.</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b-[2px] border-neutral-black bg-neutral-g1">
                                                <th className="py-4 px-6 font-display text-[10px] font-black tracking-[2px] uppercase whitespace-nowrap">Mockup</th>
                                                <th className="py-4 px-6 font-display text-[10px] font-black tracking-[2px] uppercase">Label</th>
                                                <th className="py-4 px-6 font-display text-[10px] font-black tracking-[2px] uppercase">Hex Signature</th>
                                                <th className="py-4 px-6 font-display text-[10px] font-black tracking-[2px] uppercase text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {colors.map((color) => (
                                                <tr key={color.id} className="border-b-[1px] border-neutral-black/10 hover:bg-neutral-g1/50 transition-colors group">
                                                    <td className="py-4 px-6">
                                                        <div className="w-16 h-16 border-[2px] border-neutral-black bg-white shrink-0 p-1 flex items-center justify-center overflow-hidden">
                                                            <img src={color.mockupUrl} alt={color.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" />
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="font-display text-[13px] font-black uppercase tracking-[1px] whitespace-nowrap">
                                                            {color.name}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-[2px] border-[2px] border-neutral-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0" style={{ backgroundColor: color.hex }} />
                                                            <code className="font-mono text-[12px] font-bold px-2 py-1 bg-neutral-g2 border-[1px] border-neutral-black/20 rounded-[2px]">
                                                                {color.hex.toUpperCase()}
                                                            </code>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        <button 
                                                            onClick={() => handleDeleteColor(color.id)}
                                                            className="p-3 bg-white text-danger border-[2px] border-neutral-black rounded-[4px] hover:bg-danger hover:text-white transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none inline-flex items-center gap-2 shrink-0">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
