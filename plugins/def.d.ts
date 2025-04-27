export type Config = {
    console_ip: string;
    test?: string;
}
export enum ActivityType {
    Playing = 0,
    Listening = 2,
    Watching = 3,
    Competing = 5,
}
export interface SettingsActivity {
    app: {
        name?: string;
        id?: string;
    };
    state?: string;
    details?: string;
    timestamps: {
        start?: string | number;
        end?: string | number;
    };
    assets: {
        largeImg?: string;
        smallImg?: string;
    };
    buttons: {
        text: string;
        url?: string;
    }[];
    type?: ActivityType;
}
export interface Activity {
    name: string;
    application_id?: string;
    type?: number;
    flags: number;
    state?: string;
    details?: string;
    timestamps?: {
        start?: number;
        end?: number;
    };
    assets?: {
        large_image?: string;
        large_text?: string;
        small_image?: string;
        small_text?: string;
    };
    metadata?: {
        button_urls?: string[];
    };
    buttons?: string[];
}