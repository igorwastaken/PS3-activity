import plugin from '@vendetta/plugin';
import { Activity, Config } from '../../def';
import { logger } from "@vendetta";
import Settings from "./Settings";
import { FluxDispatcher } from '@vendetta/metro/common';

enum ActivityTypes {
    PLAYING = 0,
    STREAMING = 1,
    LISTENING = 2,
    WATCHING = 3,
    // CUSTOM = 4,
    COMPETING = 5
}

const storage = plugin.storage as typeof plugin.storage & {
    selected: string;
    selections: Record<string, Config>;
};

if (typeof storage.selected?.length !== "number") {
    Object.assign(storage, {
        selected: "default",
        selections: {
            default: createDefaultSelection()
        }
    });
}
function createDefaultSelection(): Config {
    return {
        console_ip: "192.168.1.7"
    }
}

async function setActivity(activity: Activity) {
    FluxDispatcher.dispatch({
        type: 'LOCAL_ACTIVITY_UPDATE',
        activity: {
            name: activity.name,
            type: activity.type,
            details: activity.details,
            state: activity.state,
            timestamps: activity.timestamps,
            assets: activity.assets
        },
        pid: 1608,
        socketId: "PS3Activity@Vendetta"
    })
}
async function fetchPopupInfo(ip: string) {
    try {
        const response = await fetch(ip + '/popup.ps3@info15');

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const text = await response.text();

        // Transform the plain text into JSON format
        const result = {
            message: text.trim()
        };

        return result;
    } catch (error) {
        console.error('Failed to fetch popup info:', error);
        return { error: error.message };
    }
}

async function sendRequest(config: Config) {
    if (typeof config !== "string") throw new Error("You must provide your console ip");
    const url = "http://" + config;
    var response = null;
    // ping your console
    try {
        response = await fetch(url);
        if (!response.ok) throw new Error("Cannot ping console");
        const game = await fetchPopupInfo(url);
        logger.log("[PS3] " + game)
    } catch (e) {
        logger.log("[PS3] " + e)
        throw e;
    }
}
export default {
    onLoad: async () => {
        logger.log("[PS3] Hello world!");
        await sendRequest(storage.selections[storage.selected]);
    },
    onUnload: () => {
        logger.log("[PS3] Goodbye, world.");
    },
    settings: Settings,
}