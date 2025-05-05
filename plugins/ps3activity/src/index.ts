import plugin from '@vendetta/plugin';
import { Activity, Config } from '../../def';
import { logger } from '@vendetta';
import Settings from './Settings';
import { FluxDispatcher } from '@vendetta/metro/common';
import { requireNativeComponent } from 'react-native';

enum ActivityTypes {
  PLAYING = 0,
  STREAMING = 1,
  LISTENING = 2,
  WATCHING = 3,
  COMPETING = 5
}

const storage = plugin.storage as typeof plugin.storage & {
  selected: string;
  selections: Record<string, Config>;
};

if (!storage.selected || !storage.selections[storage.selected]) {
  storage.selected = 'default';
  storage.selections = { default: createDefaultSelection() };
}

function createDefaultSelection(): Config {
  return { console_ip: '192.168.1.7' };
}

let intervalId = null;

async function setActivity(activity: Activity) {
  FluxDispatcher.dispatch({
    type: 'LOCAL_ACTIVITY_UPDATE',
    activity: {
      application_id: '0',
      name: activity.name,
      type: activity.type,
      details: activity.details,
      state: activity.state,
      timestamps: activity.timestamps,
      assets: activity.assets,
      flags: 1 << 0
    },
    pid: 1608,
    socketId: 'PS3Activity@Vendetta'
  });
}

export async function fetchGameInfo(baseUrl: string): Promise<string | null> {
  try {
    const resp = await fetch(`${baseUrl}/klic.ps3`);
    if (!resp.ok) throw new Error(`Status ${resp.status}`);
    const text = await resp.text();
    return text;
  } catch (e) {
    logger.log(`[PS3] fetchGameInfo error: ${e}`);
    return null;
  }
}

export function getGameName(text: string): string[] {
  const match = text.match(/<h2>(.*?)<\/H2>/);
  return match;
}
export async function fetchPlayTime(baseUrl: string) {
  try {
    const resp = await fetch(`${baseUrl}/popup.ps3@info12`);
    if (!resp.ok) throw new Error(`Status ${resp.status}`);
    const text = await resp.text();
    const match = text.match(/<\/div>Play: (.*?)<div (.*?)>/);
    return match[1];
  } catch (e) {
    logger.error(e);
    return null;
  }
}
export function toTimeStamp(duration: string) {
  const date = new Date(); // usa a data atual
  const [hours, minutes, seconds] = duration.split(":").map(Number);

  date.setHours(hours, minutes, seconds, 0); // atualiza apenas o horário
  return date.getTime();
}
export function parseDuration(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  } else {
    return 0;
  }
}

async function updateActivity() {
  const { console_ip } = storage.selections[storage.selected];
  const baseUrl = `http://${console_ip}`;
  try {
    // Ping para garantir que o console está online
    const ping = await fetch(baseUrl);
    if (!ping.ok) throw new Error('Ping failed');
    const getPlayTime = await fetchPlayTime(baseUrl);
    if (!getPlayTime) {
      await setActivity({ name: '', type: ActivityTypes.PLAYING, flags: 1 });
      return;
    }
    // Busca o jogo atual
    const info = await fetchGameInfo(baseUrl);
    if (!info) {
      // Se não há jogo, limpa status
      await setActivity({ name: '', type: ActivityTypes.PLAYING, flags: 1 });
      return;
    }
    var gameName = ["0", "XMB"];
    var playTime = getPlayTime;
    const getName = getGameName(info)[0];
    if (!getName) {
      await setActivity({ name: '', type: ActivityTypes.PLAYING, flags: 1 << 0 })
      return;
    }

    logger.info(getName);
    // brainrot code

    const date = parseDuration(playTime);
    const calcPlay = Math.floor((Date.now() / 1000) - date);
    logger.info(calcPlay);
    logger.info(date)
    gameName = getName
      .replace(/<h2>/, "")
      .replace(/<\/H2>/, "")
      .split(" ");
    var [prefix, ...nameParts] = gameName;
    const namePartsJoin = nameParts.join(" ");
    gameName = [prefix, namePartsJoin];
    await setActivity({ name: gameName[1], timestamps: { start: calcPlay }, /*assets: { large_image: `https://raw.githubusercontent.com/aldostools/Resources/refs/heads/main/COV/${prefix}.JPG`, large_text: prefix },*/ type: ActivityTypes.PLAYING, flags: 1 });
    logger.log(`[PS3] Now playing: ${gameName}`);
  } catch (e) {
    logger.log(`[PS3] updateActivity error: ${e}`);
  }
}

export default {
  onLoad() {
    logger.log('[PS3] Plugin loaded');
    updateActivity();
    intervalId = setInterval(updateActivity, 15000);
  },

  onUnload() {
    logger.log('[PS3] Plugin unloaded');
    if (intervalId) clearInterval(intervalId);
    setActivity({ name: '', type: ActivityTypes.PLAYING, flags: 1 });
  },

  settings: Settings
};
