import { useState } from "react";
import { MapPin, Send } from "lucide-react";
import { Btn, EnquiryForm } from "./ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type EnquiryContext = { businessId: string; businessName: string; title: string; image?: string | undefined; location?: string | undefined; price?: string | undefined; description?: string | undefined };

export function EnquiryPopup({ context, label = "Get best price", buttonClassName }: { context: EnquiryContext; label?: string; buttonClassName?: string }) {
  const [open, setOpen] = useState(false);
  return <>
    <Btn type="button" onClick={() => setOpen(true)} className={buttonClassName}><Send className="size-4" />{label}</Btn>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-4xl">
        <div className="grid md:grid-cols-2">
          <div className="p-5 sm:p-8">
            <DialogHeader className="mb-5 text-left">
              <DialogTitle className="font-display text-2xl">Enquire about <span className="text-[#1673d1]">{context.title}</span></DialogTitle>
              <DialogDescription>Your enquiry goes to {context.businessName}.</DialogDescription>
            </DialogHeader>
            <EnquiryForm businessId={context.businessId} title="Your requirement" initialMessage={`I'm interested in ${context.title}. Please share details and a quote.`} onSent={() => setOpen(false)} unframed directoryStyle />
          </div>
          <div className="border-t bg-muted p-5 md:border-l md:border-t-0 sm:p-8">
            {context.image && <img src={context.image} alt={context.title} className="aspect-[4/3] w-full rounded-xl object-cover" />}
            <p className="mt-4 text-xs font-bold uppercase text-[#1673d1]">{context.businessName}</p>
            <h3 className="mt-1 font-display text-xl font-bold">{context.title}</h3>
            {context.location && <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="size-4 shrink-0" />{context.location}</p>}
            {context.price && <p className="mt-3 font-bold">{context.price}</p>}
            {context.description && <p className="mt-3 line-clamp-4 break-words text-sm leading-relaxed text-muted-foreground">{context.description}</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </>;
}
