import React from "react";
import { RouteComponentProps } from "react-router";
import { TextField } from "office-ui-fabric-react/lib/TextField";
import { PrimaryButton, MessageBar, MessageBarType, Spinner } from "office-ui-fabric-react";

import { is } from "../shared/is";
import { routes } from "../routes";
import { PlayFabHelper } from "../shared/playfab";
import { Page } from "../components/page";
import { DivConfirm } from "../styles";
import { IWithAppStateProps, withAppState } from "../containers/with-app-state";
import { TITLE_DATA_PLANETS, CATALOG_VERSION, TITLE_DATA_STORES, TITLE_DATA_ENEMIES } from "../shared/types";
import { IWithPageProps, withPage } from "../containers/with-page";
import { IEquipItemInstance } from "../store/types";
import { CloudScriptHelper } from "../shared/cloud-script";
import { IPlayerLoginResponse } from "../../cloud-script/main";
import { actionSetPlayerId, actionSetPlayerName, actionSetCatalog, actionSetInventory, actionSetPlanetsFromTitleData, actionSetStoreNamesFromTitleData, actionSetPlayerHP, actionSetEnemiesFromTitleData, actionSetEquipmentMultiple, actionSetPlayerLevel, actionSetPlayerXP } from "../store/actions";

type Props = RouteComponentProps & IWithAppStateProps & IWithPageProps;

interface IState {
    playerName: string;
    isLoggingIn: boolean;
}

class LoginPageBase extends React.Component<Props, IState> {
    constructor(props: Props) {
        super(props);

        this.state = {
            playerName: null,
            isLoggingIn: false,
        };
    }

    public render(): React.ReactNode {
        if(!this.props.appState.hasTitleId) {
            return null;
        }

        return (
            <Page {...this.props} title="Login">
                {!is.null(this.props.pageError) && (
                    <MessageBar messageBarType={MessageBarType.error}>{this.props.pageError}</MessageBar>
                )}
                <form onSubmit={this.login}>
                    <p>Start by entering a player ID. This can be a name (e.g. "James"), a GUID, or any other string.</p>
                    <p>Type a player ID you've used before to load that player's data, or enter a new one to start over.</p>
                    <p>This login happens using <a href="https://api.playfab.com/documentation/client/method/LoginWithCustomID">Custom ID</a>.</p>
                    <fieldset>
                        <legend>Player</legend>
                        <TextField label="Player ID" onChange={this.onChangePlayerName} autoFocus />
                        <DivConfirm>
                            {this.state.isLoggingIn
                                ? <Spinner label="Logging in" />
                                : <PrimaryButton text="Login" onClick={this.login} />}
                        </DivConfirm>
                    </fieldset>
                </form>
            </Page>
        );
    }

    private login = (): void => {
        this.props.onPageClearError();

        this.setState({
            isLoggingIn: true,
        });

        PlayFabHelper.LoginWithCustomID(this.props.appState.titleId, this.state.playerName, this.onLoginComplete, this.props.onPageError);
    }

    private onLoginComplete = (player: PlayFabClientModels.LoginResult): void => {
        this.props.dispatch(actionSetPlayerId(player.PlayFabId));
        this.props.dispatch(actionSetPlayerName(this.state.playerName));

        if(player.NewlyCreated) {
            PlayFabHelper.UpdateUserTitleDisplayName(this.state.playerName, this.props.onPageNothing, this.props.onPageError);
        }

        CloudScriptHelper.login((response) => {
            this.props.dispatch(actionSetPlayerHP(response.playerHP));
            this.props.dispatch(actionSetPlayerLevel(response.level));
            this.props.dispatch(actionSetPlayerXP(response.xp));
            this.props.dispatch(actionSetInventory(response.inventory));
            this.loadEquipment(response);
        }, this.props.onPageError);

        PlayFabHelper.GetTitleData([TITLE_DATA_PLANETS, TITLE_DATA_STORES, TITLE_DATA_ENEMIES], (data) => {
            this.props.dispatch(actionSetPlanetsFromTitleData(data, TITLE_DATA_PLANETS));
            this.props.dispatch(actionSetStoreNamesFromTitleData(data, TITLE_DATA_STORES));
            this.props.dispatch(actionSetEnemiesFromTitleData(data, TITLE_DATA_ENEMIES));
        }, this.props.onPageError);
        
        PlayFabHelper.GetCatalogItems(CATALOG_VERSION, (catalog) => {
            this.props.dispatch(actionSetCatalog(catalog));
        }, this.props.onPageError)
        
        this.goToGuide();
    }

    private loadEquipment(response: IPlayerLoginResponse): void {
        if(is.null(response.equipment)) {
            // You have no equipment
            return;
        }

        const equipmentSlots = Object.keys(response.equipment);

        if(is.null(equipmentSlots)) {
            // You have an equipment log in user data, but nothing actually in there
            return;
        }

        const equipment = equipmentSlots
            .map(slot => {
                const item = response.inventory.Inventory.find(i => i.ItemInstanceId === response.equipment[slot]);

                if(is.null(item)) {
                    // You have an item in your equipment list that isn't in your inventory. That's bad.
                    // We'll filter these out
                    return null;
                }
                
                return {
                    slot,
                    item,
                } as IEquipItemInstance;
            })
            .filter(i => !is.null(i));

        this.props.dispatch(actionSetEquipmentMultiple(equipment));
    }

    private goToGuide(): void {
        this.setState({
            isLoggingIn: false,
        }, () => {
            this.props.history.push(routes.Guide(this.props.appState.titleId));
        });
    }

    private onChangePlayerName = (_: any, playerName: string): void => {
        this.setState({
            playerName,
        });
    }
}

export const LoginPage = withAppState(withPage(LoginPageBase));