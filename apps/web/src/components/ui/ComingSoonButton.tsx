import { Button } from "@/components/ui/Button";
import type { ComponentProps } from "react";

/** A disabled Button with a "Coming soon" tooltip — wrapped in a span since
 *  a disabled button blocks pointer events and would otherwise suppress the
 *  native title tooltip on hover. */
export function ComingSoonButton(props: Omit<ComponentProps<typeof Button>, "disabled">) {
    return (
        <span title="Coming soon">
            <Button {...props} disabled />
        </span>
    );
}
