import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Icon, withTheme } from "@rneui/themed";
import Friend from "./Friend";
import Profile from "./Profile";
import Conversation from "./Conversation"

const Tabs = withTheme(props => {
    const { theme } = props;
    const Tab = createBottomTabNavigator();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused }) => {
                    switch (route.name) {
                        case "Conversation":
                            return (
                                <Icon
                                    name="comment"
                                    type="font-awesome"
                                    color={focused ? theme.colors.primary : theme.colors.grey1}
                                />
                            );
                        case "Friend":
                            return (
                                <Icon
                                    name="users"
                                    type="font-awesome"
                                    color={focused ? theme.colors.primary : theme.colors.grey1}
                                />
                            );
                        case "Profile":
                            return (
                                <Icon
                                    name="user"
                                    type="font-awesome"
                                    color={focused ? theme.colors.primary : theme.colors.grey1}
                                />
                            );
                        default:
                            return null;
                    }
                },
                headerShown: false,
                tabBarShowLabel: false,
            })}
        >
            <Tab.Screen name="Conversation" component={Conversation} />
            <Tab.Screen name="Friend" component={Friend} />
            <Tab.Screen name="Profile" component={Profile} />
        </Tab.Navigator>
    );
})

export default Tabs;