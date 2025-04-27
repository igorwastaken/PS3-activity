import Instance from '.';
import plugin from "@vendetta/plugin";
import { Forms } from "@vendetta/ui/components";
import { Config } from "../../def";
import ConfigEditor from "./ConfigEditor";
import { useEffect } from "react";
import { NavigationNative } from "@vendetta/metro/common";
import { TouchableOpacity } from "react-native";
const { FormText } = Forms;

const storage = plugin.storage as typeof plugin.storage & {
    selected: string;
    selections: Record<string, Config>;
};

function UpdateButton() {
    async function onPressCallback() {
        Instance.onUnload();
        Instance.onLoad();
    }

    return <TouchableOpacity onPress={onPressCallback}>
        <FormText style={{ marginRight: 12 }}>UPDATE</FormText>
    </TouchableOpacity>;
}

export default function Settings() {
    const navigation = NavigationNative.useNavigation();

    useEffect(() => {
        navigation.setOptions({
            headerRight: UpdateButton
        });
    }, []);

    return (
        <ConfigEditor selection={storage.selected} />
    );
}