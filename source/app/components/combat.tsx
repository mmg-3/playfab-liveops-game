import React from "react";
import { IWithCombatProps, withCombat, CombatStage } from "../containers/with-combat";
import { ITitleDataEnemy, ITitleDataEnemyGroup } from "../shared/types";
import { IWithAppStateProps, withAppState } from "../containers/with-app-state";
import { actionSetPlayerHP } from "../store/actions";
import { is } from "../shared/is";

interface IProps {
    planet: string;
    area: string;
    enemyGroup: ITitleDataEnemyGroup;
    enemies: ITitleDataEnemy[];
    onCombatOver: () => void;
    onLeaveCombat: () => void;
}

type Props = IProps & IWithCombatProps & IWithAppStateProps;

class CombatBase extends React.PureComponent<Props> {
    public componentDidMount(): void {
        const weapon = this.props.appState.catalog.find(i => i.ItemId === this.props.appState.equipment.weapon.ItemId);
        const armor = this.props.appState.catalog.find(i => i.ItemId === this.props.appState.equipment.armor.ItemId);

        this.props.onCombatStart(this.props.enemies, this.props.appState.playerHP, weapon, armor);
    }

    public componentDidUpdate(prevProps: Props): void {
        if(this.props.combatPlayerHP !== this.props.appState.playerHP) {
            this.props.dispatch(actionSetPlayerHP(this.props.combatPlayerHP));
        }

        if(prevProps.combatStage !== CombatStage.Victory && this.props.combatStage === CombatStage.Victory) {
            this.props.onCombatOver();
        }
    }

    public render(): React.ReactNode {
        if(this.props.combatPlayerHP <= 0 && this.props.combatStage !== CombatStage.Dead) {
            return (
                <p>Sorry, you're dead and cannot fight.</p>
            );
        }

        switch(this.props.combatStage) {
            case CombatStage.Introduction:
                return (
                    <React.Fragment>
                        <p>Welcome to combat! You face {this.props.enemies.length} enemies.</p>
                        <button onClick={this.props.onCombatAdvanceStage}>Start</button>
                    </React.Fragment>
                );
            case CombatStage.Dead:
                return (
                    <React.Fragment>
                        <p>You are dead. Sorry about that!</p>
                        <button onClick={this.props.onLeaveCombat}>Okay</button>
                    </React.Fragment>
                );
            case CombatStage.Victory:
                return (
                    <React.Fragment>
                        <button onClick={this.props.onLeaveCombat}>Continue</button>
                    </React.Fragment>
                );
            case CombatStage.Fighting:
            default:
                return (
                    <React.Fragment>
                        {this.renderEnemyAttackReport()}
                        <p>Enemies:</p>
                        <ul>
                            {this.props.combatEnemies.map((e, index) => (
                                <li key={index}><button onClick={this.props.onCombatPlayerAttack.bind(this, index)}>Shoot {e.name} ({e.hp} HP)</button></li>
                            ))}
                        </ul>
                    </React.Fragment>
                );
        }
    }

    private renderEnemyAttackReport(): React.ReactNode {
        if(is.null(this.props.combatAttackedByIndexLastRound)) {
            return null;
        }

        return (
            <p>The enemy {this.props.combatEnemies[this.props.combatAttackedByIndexLastRound].name} hit you for {this.props.combatDamageTakenLastRound} damage.</p>
        );
    }
}

export const Combat = withAppState(withCombat(CombatBase));