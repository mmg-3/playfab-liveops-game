import React from "react";

import { IWeaponData } from "../../shared/types";

interface IWeaponEditorOtherProps {
    onChange: (weapon: IWeaponData, index: number) => void;
}

type WeaponEditorProps = IWeaponData & IWeaponEditorOtherProps;
type WeaponEditorState = IWeaponData;

export class WeaponEditor extends React.Component<WeaponEditorProps, WeaponEditorState> {
    constructor(props: WeaponEditorProps) {
        super(props);

        this.state = {
            ...props,
        };
    }

    public render(): React.ReactNode {
        return (
            <React.Fragment>
                
            </React.Fragment>
        )
    }
}