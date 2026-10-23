import { drawDOM, exportImage } from "@progress/kendo-drawing";

// kendo-drawing ships as a transitive dependency of kendo-react-excel-export and
// kendo-react-pdf, so this needs no extra package. It is the same engine Kendo's
// own PDF export uses, which is why it understands the Kendo theme.
//
// Note: it captures what is laid out, not what is scrolled out of view. The Grid
// has a fixed height with its own scrollbar, so only the rows on screen appear -
// which is exactly "the visible part of the page".
export const captureElementAsPng = async (element: HTMLElement): Promise<string> => {
    const group = await drawDOM(element, {
        // 2 would be crisper on HiDPI but quadruples the payload; a dashboard at
        // scale 1 lands around 300-600 KB, well inside the 8 MB server limit.
        scale: 1
    });

    return await exportImage(group);
};
