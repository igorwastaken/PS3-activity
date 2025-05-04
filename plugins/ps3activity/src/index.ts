import plugin from '@vendetta/plugin';
import { Activity, Config } from '../../def';
import { logger } from '@vendetta';
import Settings from './Settings';
import { FluxDispatcher } from '@vendetta/metro/common';
import parse from 'node-html-parser';

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
      name: activity.name,
      type: activity.type,
      details: activity.details,
      state: activity.state,
      timestamps: activity.timestamps,
      assets: activity.assets,
      flags: activity.flags
    },
    pid: 1608,
    socketId: 'PS3Activity@Vendetta'
  });
}

async function fetchGameInfo(baseUrl: string): Promise<string> {
  try {
    const resp = await fetch(`${baseUrl}/popup.ps3@info15`);
    if (!resp.ok) throw new Error(`Status ${resp.status}`);
    const text = await resp.text();
    const parsed = parse(text);
    logger.log(text);
    logger.log(parsed);
    return text.trim();
  } catch (e) {
    logger.log(`[PS3] fetchGameInfo error: ${e}`);
    return '';
  }
}

function parseGameName(msg: string): string {
  // Extrai "Game Title" de mensagens como NPJS12345 "Game Title"
  const match = msg.match(/"(.+)"/);
  return match ? match[1] : msg;
}

async function updateActivity() {
  const { console_ip } = storage.selections[storage.selected];
  const baseUrl = `http://${console_ip}`;
  try {
    // Ping para garantir que o console está online
    const ping = await fetch(baseUrl);
    if (!ping.ok) throw new Error('Ping failed');

    // Busca o jogo atual
    const info = await fetchGameInfo(baseUrl);
    if (!info) {
      // Se não há jogo, limpa status
      await setActivity({ name: '', type: ActivityTypes.PLAYING, flags: 1 });
      return;
    }

    const gameName = parseGameName(info);
    await setActivity({ name: gameName, type: ActivityTypes.PLAYING, flags: 1 });
    logger.log(info);
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
