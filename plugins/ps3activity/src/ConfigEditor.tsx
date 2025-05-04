import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import { Config } from "../../def";
import { stylesheet } from "@vendetta/metro/common";
import { findByProps, findByStoreName } from "@vendetta/metro";
import { ScrollView } from "react-native";
import { semanticColors } from "@vendetta/ui";
import { Button, Forms } from "@vendetta/ui/components";
import { logger } from "@vendetta";

const { FormSection, FormInput } = Forms
const profiles = findByProps("showUserProfile");
const UserStore = findByStoreName("UserStore");

const styles = stylesheet.createThemedStyleSheet({
    subText: {
        fontSize: 14,
        marginLeft: 16,
        marginRight: 16,
        color: semanticColors.TEXT_MUTED
    },
    textLink: {
        color: semanticColors.TEXT_LINK,
    }
});

export async function RingConsole(ip: string) {
    await fetch(`http://${ip}/buzzer.ps3mapi?snd=2`);
    logger.log("[PS3] Ring");
}

export default function ConfigEditor({ selection }: { selection: string }) {
    const settings = useProxy(storage.selections[selection]) as Config;
    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 38 }}>
            <Button
                style={{ margin: 16 }}
                color={"brand"}
                size={Button.Sizes.MEDIUM}
                look={Button.Looks.FILLED}
                onPress={async () => {
                    profiles.showUserProfile({ userId: UserStore.getCurrentUser().id });
                }}
                text="Preview your profile"
            />
            <FormSection title="Basic" titleStyleType="no_border">
            <FormInput required autoFocus
                    title="Your console IP"
                    value={settings.console_ip}
                    placeholder="Discord"
                    onChange={v => settings.console_ip = v}
                />
                <Button
                style={{ margin: 16 }}
                color={"brand"}
                size={Button.Sizes.MEDIUM}
                look={Button.Looks.FILLED}
                onPress={async () => {
                    RingConsole(settings.console_ip)
                }}
                />
            </FormSection>
        </ScrollView>
    )
}