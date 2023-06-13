import React, { useState, useCallback } from "react";
import { withTheme } from "@rneui/themed/dist/config";
import { Text, FlatList, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { listenForConversations, openConversation } from "../firebase";
import { useFocusEffect } from '@react-navigation/native';
import { SearchBar, Avatar } from "@rneui/themed";
import { showToast } from "../utils";

const Conversation = withTheme((props) => {
    const { theme } = props
    const { navigate } = props.navigation
    const [conversations, setConversations] = useState([]);
    const [searchValue, setSearchValue] = useState("");

    useFocusEffect(
        React.useCallback(() => {
            const unsub = listenForConversations(setConversations);
            return () => {
                unsub();
            };
        }, [])
    );

    const renderConversation = (item) => {
        const uc = item.item
        return <View>
            <Pressable style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                padding: 10,
                backgroundColor: theme.colors.background,
                justifyContent: "space-between",
            }} onPress={async () => {
                const con = await openConversation(uc.frId);
                if (con) navigate("Message", { conversation: con, friendId: uc.frId, friendPhotoUrl: uc.photoURL, friendName: uc.frName });
                else showToast("error", "Error", "Can not open conversation!");
            }}>
                {uc.photoURL ? (
                    <Avatar
                        size={56}
                        rounded
                        source={{ uri: uc.photoURL }}
                        containerStyle={{
                            backgroundColor: theme.colors.grey0,
                            borderColor: theme.colors.greyOutline,
                            borderStyle: "solid",
                            borderWidth: 1,
                        }}
                    />
                ) : (
                    <Avatar
                        size={56}
                        rounded
                        icon={{
                            name: "user",
                            type: "font-awesome",
                            color: theme.colors.grey2,
                            size: 26,
                        }}
                        containerStyle={{
                            backgroundColor: theme.colors.grey0,
                            borderColor: theme.colors.greyOutline,
                            borderStyle: "solid",
                            borderWidth: 1,
                        }}
                    />
                )}

                <View style={{ flex: 1, marginHorizontal: 20 }}>
                    <Text style={{ fontSize: 16, fontWeight: uc.seen ? "normal" : "bold" }}>{uc.frName}</Text>
                    <Text style={{ fontSize: 14, color: theme.colors.grey3, fontWeight: uc.seen ? "normal" : "bold" }}>{uc.lastMessText}</Text>
                    <Text style={{ fontSize: 14, color: theme.colors.grey3, fontWeight: uc.seen ? "normal" : "bold" }}>{uc.lastMessCreatedAt}</Text>
                </View>
            </Pressable>
        </View>
    }

    const getRenderData = () => {
        if (searchValue.trim() == "") return conversations;
        else return conversations.filter(con => con.frName.toLowerCase().includes(searchValue.trim().toLowerCase()))
    }

    return <SafeAreaView style={{ backgroundColor: theme.colors.background, flex: 1 }}>
        <SearchBar
            placeholder="Looking for someone?"
            onChangeText={setSearchValue}
            value={searchValue}
            round={true}
            containerStyle={{
                borderBottomColor: "transparent",
                borderTopColor: "transparent",
                backgroundColor: theme.colors.background,
            }}
            inputContainerStyle={{
                backgroundColor: theme.colors.grey0,
            }}
        />
        <FlatList
            data={getRenderData()}
            renderItem={renderConversation}
            keyExtractor={con => con.conId}
        />
    </SafeAreaView>
})

export default Conversation