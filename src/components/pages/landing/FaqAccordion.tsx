import { useTranslations } from "next-intl";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";

export default function FaqAccordion() {

    const t = useTranslations("components.faq");

    return (
        <div className="max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-2xl xl:max-w-4xl mx-auto flex flex-col items-center my-32">
            <Label className="text-primary font-semibold mb-3 tracking-wider text-base">{t('titleMini')}</Label>
            <h3 className="text-xl sm:text-4xl md:text-5xl mb-6 md:mb-11">{t('title')}</h3>
            <Accordion type="single" collapsible className="w-full space-y-2" defaultValue="2">
                <AccordionItem
                    value="1"
                    className="bg-background has-focus-visible:border-ring has-focus-visible:ring-ring/50 rounded-md border px-4 py-1 outline-none last:border-b has-focus-visible:ring-[3px]"
                >
                    <AccordionTrigger className="py-2 text-[15px] leading-6 hover:no-underline focus-visible:ring-0">
                        {t('question1.title')}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-2">
                        <span dangerouslySetInnerHTML={{ __html: t('question1.answer') }} />
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem
                    value="2"
                    className="bg-background has-focus-visible:border-ring has-focus-visible:ring-ring/50 rounded-md border px-4 py-1 outline-none last:border-b has-focus-visible:ring-[3px]"
                >
                    <AccordionTrigger className="py-2 text-[15px] leading-6 hover:no-underline focus-visible:ring-0">
                        {t('question2.title')}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-2">
                        {t('question2.answer')}
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem
                    value="3"
                    className="bg-background has-focus-visible:border-ring has-focus-visible:ring-ring/50 rounded-md border px-4 py-1 outline-none last:border-b has-focus-visible:ring-[3px]"
                >
                    <AccordionTrigger className="py-2 text-[15px] leading-6 hover:no-underline focus-visible:ring-0">
                        {t('question3.title')}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-2">
                        {t('question3.answer')}
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem
                    value="4"
                    className="bg-background has-focus-visible:border-ring has-focus-visible:ring-ring/50 rounded-md border px-4 py-1 outline-none last:border-b has-focus-visible:ring-[3px]"
                >
                    <AccordionTrigger className="py-2 text-[15px] leading-6 hover:no-underline focus-visible:ring-0">
                        {t('question4.title')}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-2">
                        {t('question4.answer')}
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem
                    value="5"
                    className="bg-background has-focus-visible:border-ring has-focus-visible:ring-ring/50 rounded-md border px-4 py-1 outline-none last:border-b has-focus-visible:ring-[3px]"
                >
                    <AccordionTrigger className="py-2 text-[15px] leading-6 hover:no-underline focus-visible:ring-0">
                        {t('question5.title')}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-2">
                        {t('question5.answer')}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}