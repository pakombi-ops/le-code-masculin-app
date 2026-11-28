import React from 'react';
// @ts-expect-error -- @types/react-test-renderer n'est pas installé (fourni par jest-expo, sans types)
import renderer, { act } from 'react-test-renderer';
import { ConsentGate } from '../components/consent/ConsentGate';

const byTestId = (root: any, id: string) => root.find((n: any) => n.props && n.props.testID === id);

describe('ConsentGate', () => {
  it("« J'accepte » reste inactif tant que la case n'est pas cochée", () => {
    const onAccept = jest.fn();
    const onDecline = jest.fn();
    let tree: any;
    act(() => { tree = renderer.create(<ConsentGate purpose="coach" onAccept={onAccept} onDecline={onDecline} />); });

    const accept = () => byTestId(tree.root, 'consent-accept-coach');
    expect(accept().props.disabled).toBe(true);

    act(() => { byTestId(tree.root, 'consent-checkbox-coach').props.onPress(); });
    expect(accept().props.disabled).toBe(false);
    act(() => { accept().props.onPress(); });
    expect(onAccept).toHaveBeenCalledTimes(1);

    act(() => { byTestId(tree.root, 'consent-decline-coach').props.onPress(); });
    expect(onDecline).toHaveBeenCalledTimes(1);
  });

  it('chaque accord affiche son propre texte', () => {
    let journal: any;
    let coach: any;
    act(() => { journal = renderer.create(<ConsentGate purpose="journal" onAccept={jest.fn()} onDecline={jest.fn()} />); });
    act(() => { coach = renderer.create(<ConsentGate purpose="coach" onAccept={jest.fn()} onDecline={jest.fn()} />); });
    expect(JSON.stringify(journal.toJSON())).toMatch(/Ton journal reste à toi/);
    expect(JSON.stringify(journal.toJSON())).not.toMatch(/Voyage AI/);
    expect(JSON.stringify(coach.toJSON())).toMatch(/Voyage AI/);
  });
});
