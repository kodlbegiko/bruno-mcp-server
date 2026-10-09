import { describe, it, expect } from 'vitest';
import { resolveInteraction } from '../src/game/interaction';
import { Card } from '../src/types/card';
import { Player } from '../src/types/player';

describe('Interaction Resolution Engine', () => {
  const players: Player[] = [
    { id: 'p1', name: 'Sean' },
    { id: 'p2', name: 'Amy' },
    { id: 'p3', name: 'John' },
    { id: 'p4', name: 'Ryan' },
  ];

  const drawer = players[1]; // Amy is drawer

  it('correctly resolves "single" question: Drawer answers', () => {
    const card: Card = {
      id: 'one-02',
      level: 'one-star',
      stars: 1,
      zh: '你認為最能讓你放鬆或療癒的事情是什麼？',
      interaction: 'single',
      responderRule: 'drawer',
      targetRule: 'none',
    };

    const res = resolveInteraction(card, drawer, players);
    expect(res.drawer.name).toBe('Amy');
    expect(res.responders).toEqual([drawer]);
    expect(res.targets).toEqual([]);
    expect(res.needsPlayerSelection).toBe(false);
    expect(res.instruction).toBe('Amy 回答');
  });

  it('correctly resolves "all" question: All players answer', () => {
    const card: Card = {
      id: 'ice-01',
      level: 'icebreaker',
      stars: 0,
      zh: '所有玩家用十秒唱一首最喜歡的歌。',
      interaction: 'all',
      responderRule: 'all',
      targetRule: 'none',
    };

    const res = resolveInteraction(card, drawer, players);
    expect(res.responders).toEqual(players);
    expect(res.targets).toEqual([]);
    expect(res.instruction).toBe('所有人依序回答');
  });

  it('correctly resolves "othersToDrawer": Everyone except drawer answers about drawer', () => {
    const card: Card = {
      id: 'one-01',
      level: 'one-star',
      stars: 1,
      zh: '邀請大家說說對你的第一印象？（由所有玩家回應抽卡人）',
      interaction: 'othersToDrawer',
      responderRule: 'everyoneExceptDrawer',
      targetRule: 'drawer',
    };

    const res = resolveInteraction(card, drawer, players);
    // drawer is Amy (p2)
    // responders must be Sean (p1), John (p3), Ryan (p4)
    expect(res.responders.map((p) => p.name)).toEqual(['Sean', 'John', 'Ryan']);
    expect(res.targets).toEqual([drawer]);
    expect(res.instruction).toBe('除了 Amy 之外，其他人回答');
  });

  it('correctly resolves "chooseOne" before and after selection', () => {
    const card: Card = {
      id: 'two-09',
      level: 'two-star',
      stars: 2,
      zh: '對一位玩家說出你心中的感謝。記得給一個擁抱。',
      interaction: 'chooseOne',
      responderRule: 'drawerChooses',
      targetRule: 'chosenPlayer',
    };

    // Before selection
    const resBefore = resolveInteraction(card, drawer, players, []);
    expect(resBefore.needsPlayerSelection).toBe(true);
    expect(resBefore.selectionCount).toBe(1);
    expect(resBefore.instruction).toBe('Amy 選一位玩家');

    // After selection (Amy selects Sean)
    const resAfter = resolveInteraction(card, drawer, players, ['p1']);
    expect(resAfter.needsPlayerSelection).toBe(false);
    expect(resAfter.targets[0].name).toBe('Sean');
    expect(resAfter.instruction).toBe('Amy 與 Sean 互動');
  });

  it('correctly resolves "pair" interaction', () => {
    const card: Card = {
      id: 'mock-pair',
      level: 'one-star',
      stars: 1,
      zh: '雙人任務',
      interaction: 'pair',
      responderRule: 'drawerChooses',
      targetRule: 'chosenPlayer',
    };

    const res = resolveInteraction(card, drawer, players, ['p3']);
    expect(res.responders.map((p) => p.name)).toEqual(['Amy', 'John']);
    expect(res.instruction).toBe('Amy 與 John 一起完成');
  });

  it('correctly resolves "action" with selectedPlayers', () => {
    const card: Card = {
      id: 'ice-06',
      level: 'icebreaker',
      stars: 0,
      zh: '抽到卡的人，指定兩位玩家扮最醜的鬼臉！並且合影一張做記錄。',
      interaction: 'action',
      responderRule: 'selectedPlayers',
      targetRule: 'none',
      minPlayers: 3,
    };

    const resBefore = resolveInteraction(card, drawer, players, []);
    expect(resBefore.needsPlayerSelection).toBe(true);
    expect(resBefore.selectionCount).toBe(2);

    const resAfter = resolveInteraction(card, drawer, players, ['p1', 'p4']);
    expect(resAfter.needsPlayerSelection).toBe(false);
    expect(resAfter.responders.map((p) => p.name)).toEqual(['Sean', 'Ryan']);
    expect(resAfter.instruction).toBe('由 Sean 與 Ryan 執行');
  });
});
