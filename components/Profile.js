import React, { useContext, useEffect, useState } from "react";
import { View, Alert } from "react-native";
import { Text, withTheme, Avatar, Button, Icon, Input } from "@rneui/themed";
import { SafeAreaView } from "react-native-safe-area-context";
import UserContext from "../context";
import { showToast, selectImage } from "../utils";
import { uploadImage, unfriend, auth, addRequest, removeRequest, acceptReceivedRequest, updateUser } from "../firebase";
import { signOut } from "firebase/auth"

const Profile = withTheme(props => {
    const { theme } = props;
    const { currentUser, setCurrentUser } = useContext(UserContext);
    const [editMode, setEditMode] = useState(false);
    const [editName, setEditName] = useState(currentUser.displayName);
    const [user, setUser] = useState(currentUser);

    const logout = () => {
        Alert.alert("Confirmation", "Do you want to log out?", [
            {
                text: "Cancel",
                style: "cancel",
            },
            {
                text: "OK",
                onPress: async () => {
                    try {
                        await signOut(auth)
                        setCurrentUser(null);
                    } catch (error) {
                        console.log("Logout failed with exception:", { error });
                    }
                },
            },
        ]);
    };

    const [subButton, setSubButton] = useState({
        align: "flex-end",
        title: "Logout",
        color: "error",
        icon: "sign-out",
        onPress: logout
    })

    useEffect(() => {
        if (props.user) setUser(props.user);
        if (props.subButton) setSubButton(props.subButton);
    }, [])

    const handleAction = async (extraData = false) => {
        let result = false;
        switch (props.profileType) {
            case "Friend":
                result = await unfriend(user.id)
                if (result) showToast("success", "Success", "Unfriend successfully!");
                else showToast("error", "Error", "Unfriend failed!");
                break;
            case "Stranger":
                result = await addRequest(user.id);
                if (result) showToast("success", "Success", `Sent friend request to ${user.displayName}!`);
                else showToast("error", "Error", "Can not send friend request!");
                break;
            case "Sent":
                result = await removeRequest(user.reqId);
                if (result) showToast("success", "Success", `Removed request to ${user.displayName}!`);
                else showToast("error", "Error", "Can not remove friend request!");
                break;
            case "Received":
                if (extraData) {
                    result = await acceptReceivedRequest(user.reqId);
                    if (result) showToast("success", "Success", `You and ${user.displayName} are friends now!`);
                    else showToast("error", "Error", "Can not accept friend request!");
                } else {
                    result = await removeRequest(user.reqId);
                    if (result) showToast("success", "Success", `Denied ${user.displayName} friend request!`);
                    else showToast("error", "Error", "Can not deny friend request!");
                }
                break;
            default:
                if (editMode) {
                    if (!editName || editName == "" || editName.trim() == "") {
                        showToast('error', 'Error', 'Your name is not valid')
                        return;
                    }
                    const result = await updateUser({ displayName: editName });
                    if (result) {
                        setEditMode(false);
                        showToast('success', 'Success', 'Edit profile successfully!');
                    } else showToast('error', 'Error', 'Try again later')
                } else setEditMode(true);
                break;
        }
    }

    const changeAvatar = async () => {
        const image = await selectImage();
        if (image) {
            const url = await uploadImage("users/" + currentUser.uid, image.uri);
            const result = await updateUser({ photoURL: url })
            if (result) {
                setUser({ ...user, photoURL: url })
                showToast('success', 'Success', 'Change avatar successfully!')
            } else showToast('error', 'Error', 'Try again later')
        }
    }

    const renderAvatar = () => {
        switch (props.profileType) {
            case "Friend":
            case "Stranger":
            case "Sent":
            case "Received":
                if (user.photoURL) {
                    return (<Avatar
                        size={128}
                        rounded
                        source={{ uri: user.photoURL }}
                        containerStyle={{
                            backgroundColor: theme.colors.grey0,
                            borderColor: theme.colors.greyOutline,
                            borderStyle: "solid",
                            borderWidth: 1,
                            alignSelf: "center"
                        }}
                    ></Avatar>);
                } else {
                    return (<Avatar
                        size={128}
                        rounded
                        icon={{
                            name: "user",
                            type: "font-awesome",
                            color: theme.colors.grey2,
                            size: 64,
                        }}
                        containerStyle={{
                            backgroundColor: theme.colors.grey0,
                            borderColor: theme.colors.greyOutline,
                            borderStyle: "solid",
                            borderWidth: 1,
                            alignSelf: "center"
                        }}
                    ></Avatar>)
                }
            default:
                if (user.photoURL) {
                    return (<Avatar
                        onPress={async () => { await changeAvatar() }}
                        size={128}
                        rounded
                        source={{ uri: user.photoURL }}
                        containerStyle={{
                            backgroundColor: theme.colors.grey0,
                            borderColor: theme.colors.greyOutline,
                            borderStyle: "solid",
                            borderWidth: 1,
                            alignSelf: "center"
                        }}
                    >
                        <Avatar.Accessory style={{ backgroundColor: theme.colors.warning }} onPress={async () => { await changeAvatar() }} size={32} />
                    </Avatar>);
                } else {
                    return (<Avatar
                        onPress={async () => { await changeAvatar() }}
                        size={128}
                        rounded
                        icon={{
                            name: "user",
                            type: "font-awesome",
                            color: theme.colors.grey2,
                            size: 64,
                        }}
                        containerStyle={{
                            backgroundColor: theme.colors.grey0,
                            borderColor: theme.colors.greyOutline,
                            borderStyle: "solid",
                            borderWidth: 1,
                            alignSelf: "center"
                        }}
                    >
                        <Avatar.Accessory style={{ backgroundColor: theme.colors.warning }} onPress={async () => { await changeAvatar() }} size={32} />
                    </Avatar>)
                }
        }
    }

    const renderActionButton = () => {
        switch (props.profileType) {
            case "Friend":
                return (
                    <Button containerStyle={{ borderRadius: 5 }} onPress={() => handleAction()} color="error">
                        <Icon name="remove" type="font-awesome" color="white" containerStyle={{ marginEnd: 10 }} />
                        Unfriend
                    </Button>
                );
            case "Stranger":
                return (
                    <Button containerStyle={{ borderRadius: 5 }} onPress={() => handleAction()} color="success">
                        <Icon name="plus" type="font-awesome" color="white" containerStyle={{ marginEnd: 10 }} />
                        Add friend
                    </Button>
                );
            case "Sent":
                return (
                    <Button containerStyle={{ borderRadius: 5 }} onPress={() => handleAction()} color="error">
                        <Icon name="remove" type="font-awesome" color="white" containerStyle={{ marginEnd: 10 }} />
                        Remove request
                    </Button>
                );
            case "Received":
                return (
                    <>
                        <Button containerStyle={{ borderRadius: 5, marginEnd: 10 }} onPress={() => handleAction()} color="error">
                            <Icon name="remove" type="font-awesome" color="white" containerStyle={{ marginEnd: 10 }} />
                            Deny
                        </Button>
                        <Button containerStyle={{ borderRadius: 5 }} onPress={() => handleAction(true)} color="success">
                            <Icon name="check" type="font-awesome" color="white" containerStyle={{ marginEnd: 10 }} />
                            Accept
                        </Button>
                    </>
                );
            default:
                if (editMode) {
                    return (
                        <>
                            <Button containerStyle={{ borderRadius: 5, marginEnd: 10 }} color="warning" onPress={() => {
                                setEditName(currentUser.displayName);
                                setEditMode(false);
                            }}>
                                <Icon name="times" type="font-awesome" color="white" containerStyle={{ marginEnd: 10 }} />
                                Cancel
                            </Button>
                            <Button containerStyle={{ borderRadius: 5 }} onPress={() => handleAction()} color="success">
                                <Icon name="save" type="font-awesome" color="white" containerStyle={{ marginEnd: 10 }} />
                                Save
                            </Button>
                        </>
                    );
                } else {
                    return (
                        <Button containerStyle={{ borderRadius: 5 }} onPress={() => handleAction()} color="warning">
                            <Icon name="edit" type="font-awesome" color="white" containerStyle={{ marginEnd: 10 }} />
                            Edit
                        </Button>
                    );
                }
        }
    }

    return <SafeAreaView style={{ backgroundColor: theme.colors.background, flex: 1, padding: 10 }}>
        <Button buttonStyle={{ borderRadius: 10, alignSelf: subButton.align }} color={subButton.color} onPress={() => { subButton.onPress() }}>
            <Icon name={subButton.icon} type="font-awesome" color="white" size={15} />
            {" " + subButton.title}
        </Button>

        {renderAvatar()}

        <View style={{ marginTop: 10, marginBottom: 20, alignItems: 'center', width: '100%' }}>
            {editMode ?
                <Input defaultValue={currentUser.displayName} onChangeText={setEditName}></Input> :
                <Text style={{ fontSize: 20 }}>{user.displayName}</Text>}
            <Text style={{ fontSize: 14, color: theme.colors.grey3 }}>{user.email}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignSelf: "center" }}>
            {renderActionButton()}
        </View>

    </SafeAreaView>
})

export default Profile;