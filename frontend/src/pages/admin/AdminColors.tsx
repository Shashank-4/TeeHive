import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Loader2, Image as ImageIcon, AlertCircle, Layers, Map } from "lucide-react";
import api from "../../api/axios";
import Toast from "../../components/shared/Toast";

interface GlobalColor {
    id: string;
    name: string;
    hex: string;
    mockupUrl: string;
    backMockupUrl?: string;
    shadowMapUrl?: string;
    displacementMapUrl?: string;
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

    // File slots
    const [mockupFile, setMockupFile] = useState<File | null>(null);
    const [mockupPreview, setMockupPreview] = useState<string | null>(null);
    const [backMockupFile, setBackMockupFile] = useState<File | null>(null);
    const [backMockupPreview, setBackMockupPreview] = useState<string | null>(null);
    const [shadowFile, setShadowFile] = useState<File | null>(null);
    const [shadowPreview, setShadowPreview] = useState<string | null>(null);
    const [displacementFile, setDisplacementFile] = useState<File | null>(null);
    const [displacementPreview, setDisplacementPreview] = useState<string | null>(null);

    const mockupInputRef = useRef<HTMLInputElement>(null);
    const backMockupInputRef = useRef<HTMLInputElement>(null);
    const shadowInputRef = useRef<HTMLInputElement>(null);
    const displacementInputRef = useRef<HTMLInputElement>(null);

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

    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        setFile: (f: File | null) => void,
        setPreview: (u: string | null) => void
    ) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const resetForm = () => {
        setNewColorName("");
        setNewColorHex("#000000");
        setMockupFile(null); setMockupPreview(null);
        setBackMockupFile(null); setBackMockupPreview(null);
        setShadowFile(null); setShadowPreview(null);
        setDisplacementFile(null); setDisplacementPreview(null);
        if (mockupInputRef.current) mockupInputRef.current.value = "";
        if (backMockupInputRef.current) backMockupInputRef.current.value = "";
        if (shadowInputRef.current) shadowInputRef.current.value = "";
        if (displacementInputRef.current) displacementInputRef.current.value = "";
    };

    const handleAddColor = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newColorName.trim() || !newColorHex || !mockupFile) {
            setToast({ message: "Color label, hex, and base mockup are required.", type: "error" });
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append("name", newColorName.trim());
        formData.append("hex", newColorHex);
        formData.append("mockup", mockupFile);
        if (backMockupFile) formData.append("backMockup", backMockupFile);
        if (shadowFile) formData.append("shadowMap", shadowFile);
        if (displacementFile) formData.append("displacementMap", displacementFile);

        try {
            await api.post("/api/colors", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setToast({ message: "Color successfully injected with all asset layers", type: "success" });
            resetForm();
            fetchColors();
        } catch (err: any) {
            setToast({ message: err.response?.data?.message || "Failed to add color", type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteColor = async (id: string) => {
        if (!confirm("Erase this global color and all its R2 assets? Products using this color may lose references.")) return;

        try {
            await api.delete(`/api/colors/${id}`);
            setToast({ message: "Color and all layers deleted", type: "success" });
            setColors(colors.filter((c) => c.id !== id));
        } catch {
            setToast({ message: "Failed to delete color", type: "error" });
        }
    };

    /** Reusable upload slot component */
    const FileUploadSlot = ({
        label,
        sublabel,
        icon: Icon,
        fileRef,
        preview,
        onFileChange,
        required,
    }: {
        label: string;
        sublabel: string;
        icon: React.ElementType;
        fileRef: React.RefObject<HTMLInputElement | null>;
        preview: string | null;
        onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
        required?: boolean;
    }) => (
        <div>
            <label className="block font-display text-[10px] font-black uppercase tracking-[1px] mb-2 flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 text-primary" />
                {label} {required && <span className="text-danger">*</span>}
            </label>
            <div className="border-[2px] border-dashed border-neutral-black/50 rounded-[2px] p-3 text-center relative overflow-hidden group cursor-pointer hover:bg-neutral-g1 transition-colors">
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                {preview ? (
                    <div className="relative w-full aspect-[4/3] border-[1px] border-neutral-black bg-white flex items-center justify-center rounded-[2px] overflow-hidden">
                        <img src={preview} alt="Preview" className="w-[90%] h-[90%] object-contain" />
                    </div>
                ) : (
                    <div className="py-4 flex flex-col items-center justify-center pointer-events-none">
                        <Icon className="w-6 h-6 text-neutral-g4 mb-2 group-hover:text-primary group-hover:scale-110 transition-all" />
                        <p className="font-display text-[9px] font-black uppercase tracking-[1px]">Click to Select</p>
                        <p className="font-display text-[8px] font-bold text-neutral-g4 uppercase mt-0.5">{sublabel}</p>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="w-full min-h-screen bg-neutral-g1 flex flex-col pt-4 text-neutral-black">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="flex-1 px-4 sm:px-8 pb-12 w-full max-w-7xl mx-auto space-y-8">
                {/* Header Subtext */}
                <div>
                    <p className="font-display text-[12px] font-black uppercase tracking-[1px] text-neutral-g4 mb-4 pb-4 border-b-[2px] border-neutral-black/10">
                        Define global blank mockups with shadow and displacement maps for realistic product rendering.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* ── Add New Color Form ── */}
                    <div className="lg:col-span-1">
                        <div className="bg-white border-[2px] border-neutral-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-[4px] p-6 sticky top-24">
                            <h3 className="font-display text-[16px] font-black uppercase tracking-[2px] mb-6 border-b-[2px] border-neutral-black pb-2">
                                Inject New Color
                            </h3>

                            <form onSubmit={handleAddColor} className="space-y-5">
                                {/* Name */}
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

                                {/* Hex */}
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

                                {/* ── 3 Asset Upload Slots ── */}
                                <div className="space-y-4 pt-2 border-t-[2px] border-neutral-black/10">
                                    <p className="font-display text-[9px] font-black uppercase tracking-[2px] text-neutral-g4 pt-2">
                                        Realism Asset Pipeline
                                    </p>

                                    <FileUploadSlot
                                        label="Front Color Base"
                                        sublabel="High-res front blank garment"
                                        icon={ImageIcon}
                                        fileRef={mockupInputRef}
                                        preview={mockupPreview}
                                        onFileChange={(e) => handleFileChange(e, setMockupFile, setMockupPreview)}
                                        required
                                    />

                                    <FileUploadSlot
                                        label="Back Color Base"
                                        sublabel="High-res back blank garment (Optional)"
                                        icon={ImageIcon}
                                        fileRef={backMockupInputRef}
                                        preview={backMockupPreview}
                                        onFileChange={(e) => handleFileChange(e, setBackMockupFile, setBackMockupPreview)}
                                    />

                                    <FileUploadSlot
                                        label="Shadow / Highlight Map"
                                        sublabel="Transparent PNG with baked folds"
                                        icon={Layers}
                                        fileRef={shadowInputRef}
                                        preview={shadowPreview}
                                        onFileChange={(e) => handleFileChange(e, setShadowFile, setShadowPreview)}
                                    />

                                    <FileUploadSlot
                                        label="Displacement Map"
                                        sublabel="8-bit grayscale for pixel warping"
                                        icon={Map}
                                        fileRef={displacementInputRef}
                                        preview={displacementPreview}
                                        onFileChange={(e) => handleFileChange(e, setDisplacementFile, setDisplacementPreview)}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`w-full py-4 bg-primary text-neutral-black border-[2px] border-neutral-black font-display text-[13px] font-black uppercase tracking-[2px] rounded-[2px] flex items-center justify-center gap-2 transition-all ${
                                        isSubmitting
                                            ? "opacity-70 cursor-wait"
                                            : "hover:bg-primary-dark shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-y-[-2px] hover:translate-y-0 translate-x-[-2px] hover:translate-x-0 active:translate-y-0.5 active:translate-x-0.5"
                                    }`}
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /> Mount Color</>}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* ── Active Colors Table ── */}
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
                                                <th className="py-4 px-6 font-display text-[10px] font-black tracking-[2px] uppercase">Hex</th>
                                                <th className="py-4 px-6 font-display text-[10px] font-black tracking-[2px] uppercase text-center">Asset Layers</th>
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
                                                        <div className="font-display text-[13px] font-black uppercase tracking-[1px] whitespace-nowrap">{color.name}</div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-[2px] border-[2px] border-neutral-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0" style={{ backgroundColor: color.hex }} />
                                                            <code className="font-mono text-[12px] font-bold px-2 py-1 bg-neutral-g2 border-[1px] border-neutral-black/20 rounded-[2px]">{color.hex.toUpperCase()}</code>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <div className={`w-6 h-6 rounded-[2px] border-[1.5px] flex items-center justify-center text-[8px] font-black ${color.mockupUrl ? "border-success bg-success/10 text-success" : "border-neutral-g3 bg-neutral-g1 text-neutral-g3"}`} title="Front Base">
                                                                F
                                                            </div>
                                                            <div className={`w-6 h-6 rounded-[2px] border-[1.5px] flex items-center justify-center text-[8px] font-black ${color.backMockupUrl ? "border-success bg-success/10 text-success" : "border-neutral-g3 bg-neutral-g1 text-neutral-g3"}`} title="Back Base">
                                                                B
                                                            </div>
                                                            <div className={`w-6 h-6 rounded-[2px] border-[1.5px] flex items-center justify-center text-[8px] font-black ${color.shadowMapUrl ? "border-success bg-success/10 text-success" : "border-neutral-g3 bg-neutral-g1 text-neutral-g3"}`} title="Shadow Map">
                                                                S
                                                            </div>
                                                            <div className={`w-6 h-6 rounded-[2px] border-[1.5px] flex items-center justify-center text-[8px] font-black ${color.displacementMapUrl ? "border-success bg-success/10 text-success" : "border-neutral-g3 bg-neutral-g1 text-neutral-g3"}`} title="Displacement Map">
                                                                D
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        <button
                                                            onClick={() => handleDeleteColor(color.id)}
                                                            className="p-3 bg-white text-danger border-[2px] border-neutral-black rounded-[4px] hover:bg-danger hover:text-white transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none inline-flex items-center gap-2 shrink-0"
                                                        >
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
