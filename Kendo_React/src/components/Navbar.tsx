import {
    AppBar,
    AppBarSection,
    AppBarSpacer,
    Avatar,
} from "@progress/kendo-react-layout";
import { menuIcon, logoutIcon } from '@progress/kendo-svg-icons';
import { Button } from '@progress/kendo-react-buttons';
import { useNavigate } from 'react-router-dom';
import { logout } from '../services/AuthService';

type NavbarProps = {
    onMenuClick: () => void;
}
function Navbar({ onMenuClick }: NavbarProps) {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
        } finally {
            navigate("/login", { replace: true });
        }
    };

    return (
        <>
            <AppBar themeColor='base'>
                <AppBarSection>
                    <Button type="button" fillMode='flat' svgIcon={menuIcon} onClick={onMenuClick} />
                </AppBarSection>
                <AppBarSpacer style={{ width: 32 }} />
                <AppBarSpacer />
                <AppBarSection>
                    <Avatar>SK</Avatar>
                </AppBarSection>
                <AppBarSection>
                    <Button
                        type="button"
                        fillMode="flat"
                        svgIcon={logoutIcon}
                        onClick={handleLogout}
                        title="Logout"
                    >
                        Logout
                    </Button>
                </AppBarSection>


            </AppBar>






        </>
    )
}

export default Navbar