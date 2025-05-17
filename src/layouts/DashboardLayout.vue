<style scoped>
    .layout{
        border: 1px solid #d7dde4;
        background: #f5f7f9;
        position: relative;
        border-radius: 4px;
        overflow: hidden;
    }
    .layout-header{
        background: #2d8cf0;
        padding: 0;
        height: auto;
    }
    .layout-header-bar{
        background: #fff;
        box-shadow: 0 1px 1px rgba(0,0,0,.1);
        display: flex;
        align-items: center;
        height: 50px;
        padding-left: 20px;
    }
    .layout-logo {
    width: 100px;
    height:100px;
    background: url('./src/assets/J&W Logo.png') no-repeat center center;
    background-size: contain;
    border-radius: 3px;
    margin: 10px 20px;
    float: left;
}
    .menu-item{
        display: flex;
        align-items: center;
    }
    .menu-item i{
        margin-right: 5px;
    }
</style>
<template>
    <div class="layout">
        <Layout style="height: 100vh;">
            <Header class="layout-header">
                <Menu mode="horizontal" theme="dark" :active-name="currentRoute">
                    <div class="layout-logo"></div>
                    <MenuItem @click.native="goTo('/home')" name="/home">
                        <Icon type="ios-home"></Icon>
                        <span>Dashboard</span>
                    </MenuItem>
                    <MenuItem @click.native="goTo('/new-registration')" name="/new-registration">
                        <Icon type="ios-person-add"></Icon>
                        <span>New Registration</span>
                    </MenuItem>
                    <MenuItem @click.native="goTo('/transactions')" name="/transactions">
                        <Icon type="ios-card"></Icon>
                        <span>Transaction</span>
                    </MenuItem>
                    <MenuItem @click.native="goTo('/parking-records')" name="/parking-records">
                        <Icon type="ios-list"></Icon>
                        <span>Parking Records</span>
                    </MenuItem>
                    <MenuItem @click.native="goTo('/parking-slots')" name="/parking-slots">
                        <Icon type="ios-car"></Icon>
                        <span>Parking Slots</span>
                    </MenuItem>
                    <MenuItem @click.native="goTo('/settings')" name="/settings">
                        <Icon type="ios-settings"></Icon>
                        <span>Settings</span>
                    </MenuItem>
                    <MenuItem @click.native="goTo('/about')" name="/help">
                        <Icon type="ios-information-circle"></Icon>
                        <span>About</span>
                    </MenuItem>
                </Menu>
            </Header>
            <Layout>
                <Header class="layout-header-bar">
                    <b>J&W PayParking Monthly Overview</b>
                </Header>
                <Content :style="{margin: '20px', background: '#fff', minHeight: '260px', overflowY: 'auto'}">
                    <RouterView></RouterView>
                </Content>
            </Layout>
        </Layout>
    </div>
</template>
<script>
    export default {
        data () {
            return {
                // No need for isCollapsed in horizontal layout
            }
        },
        computed: {
            currentRoute() {
                return this.$route.path
            }
        },
        methods: {
            goTo(path) {
                this.$router.push(path);
            }
        }
    }
</script>