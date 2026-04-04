import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { X, Loader2, CheckCircle2, BoxSelect } from "lucide-react";

interface Design {
    id: string;
    title: string;
    imageUrl: string;
    isManifested?: boolean;
    status?: string;
}

type ViewType = "front" | "back";

interface SelectDesignModalProps {
    onClose: () => void;
    onDesignSelect: (design: Design, view: ViewType) => void;
    targetView: ViewType;
    currentFrontDesignId: string | null;
    currentBackDesignId: string | null;
}

const SelectDesignModal: React.FC<SelectDesignModalProps> = ({
    onClose,
    onDesignSelect,
    targetView,
    currentFrontDesignId,
    currentBackDesignId,
}) => {
    const [designs, setDesigns] = useState<Design[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const currentDesignId = targetView === "front" ? currentFrontDesignId : currentBackDesignId;

    useEffect(() => {
        const fetchDesigns = async () => {
            try {
                const response = await api.get("/api/designs");
                setDesigns(response.data.data.designs);
            } catch (error) {
                console.error("Failed to fetch designs for modal", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDesigns();
    }, []);

    const handleSelect = (design: Design) => {
        if (design.isManifested && design.id !== (targetView === "front" ? currentFrontDesignId : currentBackDesignId)) return;
        if (design.status !== "APPROVED") return;
        onDesignSelect(design, targetView);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-neutral-black/90 backdrop-blur-sm flex items-center justify-center z-[150] p-4 text-neutral-black">
            <div className="bg-white border-[3px] border-neutral-black rounded-[8px] shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-neutral-black p-6 flex justify-between items-center text-white">
                    <div className="flex items-center gap-4">
                        <BoxSelect className="w-6 h-6 text-primary" />
                        <div>
                            <h3 className="font-display text-[16px] font-black uppercase tracking-[2px]">Select Source Graphics</h3>
                            <p className="font-display text-[9px] font-bold text-primary italic uppercase tracking-[1px]">Assigning to {targetView} sector</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 hover:rotate-90 transition-all duration-300">
                        <X className="w-6 h-6 text-neutral-g2 hover:text-white" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 max-h-[65vh] overflow-y-auto bg-neutral-g1 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col justify-center items-center h-64 gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-primary" />
                            <span className="font-display text-[10px] font-black uppercase tracking-[2px]">Indexing Vault...</span>
                        </div>
                    ) : designs.length === 0 ? (
                        <div className="text-center py-20 border-[2px] border-dashed border-neutral-black/20 rounded-[6px]">
                            <p className="font-display text-[14px] font-black uppercase text-neutral-g3 italic">Vault access empty. No source graphics detected.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            {designs.map((design) => {
                                const isCurrent = currentDesignId === design.id;
                                const isOther = targetView === "front" ? currentBackDesignId === design.id : currentFrontDesignId === design.id;
                                const isApproved = design.status === "APPROVED";
                                const isManifestedDisabled = design.isManifested && !isCurrent && !isOther;
                                const isDisabled = !isApproved || isManifestedDisabled;

                                return (
                                    <button
                                        key={design.id}
                                        disabled={isDisabled}
                                        onClick={() => handleSelect(design)}
                                        className={`group relative aspect-square bg-white border-[2px] rounded-[4px] overflow-hidden transition-all
                                            ${isCurrent
                                                ? "border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]"
                                                : isDisabled
                                                ? "border-neutral-g2 grayscale opacity-50 cursor-not-allowed"
                                                : "border-neutral-black hover:border-primary hover:shadow-[4px_4px_0px_0px_rgba(255,222,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
                                            }
                                        `}
                                    >
                                        <img
                                            src={design.imageUrl}
                                            alt={design.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />

                                        {/* Badges */}
                                        <div className="absolute top-2 right-2 flex flex-col gap-2">
                                            {isCurrent && (
                                                <div className="bg-primary border-[1px] border-neutral-black rounded-full p-1 shadow-sm">
                                                    <CheckCircle2 size={14} className="text-neutral-black stroke-[3px]" />
                                                </div>
                                            )}
                                            {isManifestedDisabled && (
                                                <div className="bg-primary text-neutral-black text-[7px] font-black font-display uppercase px-2 py-1 rounded-[2px] shadow-sm border-[1px] border-neutral-black">
                                                    Manifested
                                                </div>
                                            )}
                                            {!isApproved && !isManifestedDisabled && (
                                                <div className="bg-neutral-black/90 text-white text-[7px] font-black font-display uppercase px-2 py-1 rounded-[2px] shadow-sm border-[1px] border-neutral-black">
                                                    {design.status === "REJECTED"
                                                        ? "Rejected"
                                                        : "Pending"}
                                                </div>
                                            )}
                                            {isOther && (
                                                <div className="bg-neutral-black text-white text-[8px] font-black font-display uppercase px-2 py-1 rounded-[2px] shadow-sm">
                                                    {targetView === "front" ? "Back-Link" : "Front-Link"}
                                                </div>
                                            )}
                                        </div>

                                        {/* Label Overlay */}
                                        {!isDisabled && (
                                            <div className="absolute inset-x-0 bottom-0 bg-neutral-black/80 p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                                <p className="font-display text-[9px] font-black text-white uppercase truncate">{design.title}</p>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-white border-t-[2px] border-neutral-black flex flex-col items-center gap-3 text-center">
                    <p className="font-display text-[10px] font-black uppercase text-neutral-g3 tracking-[2px]">
                        Select visual asset to initialize manifestation circuit
                    </p>
                    <p className="font-display text-[10px] font-bold text-neutral-black max-w-lg leading-relaxed">
                        <span className="font-black uppercase tracking-wide">Note:</span> Designs labeled{" "}
                        <span className="font-black uppercase">Manifested</span> are already used in a product and cannot be
                        selected again for a new product.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SelectDesignModal;
