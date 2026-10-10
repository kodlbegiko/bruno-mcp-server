import { Card } from '../types/card';
import { Player } from '../types/player';
import { ResolvedInteraction } from '../types/game';

/**
 * Pure domain logic: Resolves the interaction rules, responder roles,
 * targets, and clear user-facing guidance without any React component dependency.
 */
export function resolveInteraction(
  card: Card,
  drawer: Player,
  players: Player[],
  selectedPlayerIds: string[] = []
): ResolvedInteraction {
  const selectedPlayers = players.filter((p) => selectedPlayerIds.includes(p.id));

  switch (card.interaction) {
    case 'all': {
      return {
        drawer,
        responders: players,
        targets: [],
        needsPlayerSelection: false,
        selectionCount: 0,
        instruction: '所有人依序回答',
      };
    }

    case 'othersToDrawer': {
      const responders = players.filter((p) => p.id !== drawer.id);
      return {
        drawer,
        responders,
        targets: [drawer],
        needsPlayerSelection: false,
        selectionCount: 0,
        instruction: `除了 ${drawer.name} 之外，其他人回答`,
      };
    }

    case 'chooseOne': {
      const needsSelection = selectedPlayers.length === 0;
      const target = selectedPlayers[0];

      if (card.responderRule === 'selectedPlayer' || card.responderRule === 'selectedPlayers') {
        return {
          drawer,
          responders: target ? [target] : [],
          targets: [],
          needsPlayerSelection: needsSelection,
          selectionCount: 1,
          instruction: target
            ? `${target.name} 回答`
            : `${drawer.name} 選一位玩家回答`,
        };
      }

      return {
        drawer,
        responders: [drawer],
        targets: target ? [target] : [],
        needsPlayerSelection: needsSelection,
        selectionCount: 1,
        instruction: target
          ? `${drawer.name} 與 ${target.name} 互動`
          : `${drawer.name} 選一位玩家`,
      };
    }

    case 'pair': {
      const needsSelection = selectedPlayers.length === 0;
      const partner = selectedPlayers[0];
      return {
        drawer,
        responders: partner ? [drawer, partner] : [drawer],
        targets: partner ? [partner] : [],
        needsPlayerSelection: needsSelection,
        selectionCount: 1,
        instruction: partner
          ? `${drawer.name} 與 ${partner.name} 一起完成`
          : `${drawer.name} 邀請一位玩家共同完成`,
      };
    }

    case 'action': {
      if (card.responderRule === 'selectedPlayers') {
        const needsSelection = selectedPlayers.length < 2;
        return {
          drawer,
          responders: selectedPlayers,
          targets: [],
          needsPlayerSelection: needsSelection,
          selectionCount: 2,
          instruction: selectedPlayers.length >= 2
            ? `由 ${selectedPlayers.map((p) => p.name).join(' 與 ')} 執行`
            : `${drawer.name} 指定兩位玩家`,
        };
      }
      return {
        drawer,
        responders: players,
        targets: [],
        needsPlayerSelection: false,
        selectionCount: 0,
        instruction: '大家一起完成這個任務',
      };
    }

    case 'discussion': {
      return {
        drawer,
        responders: players,
        targets: [],
        needsPlayerSelection: false,
        selectionCount: 0,
        instruction: '大家自由交流與討論',
      };
    }

    case 'single':
    default: {
      return {
        drawer,
        responders: [drawer],
        targets: [],
        needsPlayerSelection: false,
        selectionCount: 0,
        instruction: `${drawer.name} 回答`,
      };
    }
  }
}
