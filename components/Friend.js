import React, { useEffect, useState } from "react";

import { Text, View, FlatList, Modal, Pressable } from "react-native";
import {
  Avatar,
  withTheme,
  Button,
  Icon,
  SearchBar,
  Chip,
  Badge,
  Image,
} from "@rneui/themed";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getFriendListData,
  getStrangerListData,
  addRequest,
  removeRequest,
  getRequestList,
  acceptReceivedRequest,
  openConversation
} from "../firebase";
import { showToast } from "../utils";

import Profile from "./Profile";

const Friend = withTheme((props) => {
  const { theme } = props;
  const { navigate } = props.navigation;

  const listType = [
    {
      title: "Friend",
      buttonText: "View profile",
      buttonIcon: "user",
      buttonColor: theme.colors.primary,
    },
    {
      title: "Stranger",
      buttonText: "Add friend",
      buttonIcon: "user-plus",
      buttonColor: theme.colors.success,
    },
    {
      title: "Sent",
      buttonText: "Remove",
      buttonIcon: "remove",
      buttonColor: theme.colors.error,
    },
    {
      title: "Received",
      buttonText: "Accept",
      buttonIcon: "check",
      buttonColor: theme.colors.success,
    },
  ];

  const [isLoading, setIsLoading] = useState(true);
  const [friendList, setFriendList] = useState([]);
  const [strangerList, setStrangerList] = useState([]);
  const [sentRequestList, setSentRequestList] = useState([]);
  const [receivedRequestList, setReceivedRequestList] = useState([]);
  const [selectedList, setSelectedList] = useState(listType[0]);
  const [viewUser, setViewUser] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const [showAvatar, setShowAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const unsubRequest = getRequestList(setSentRequestList, setReceivedRequestList);
      await getFriendList();
      await getStrangerList();
      setIsLoading(false);
      return unsubRequest;
    };
  
    fetchData();
  }, []);  

  const getFriendList = async (reload = false) => {
    let lastId = null;
    if (!reload && friendList.length > 0)
      lastId = friendList[friendList.length - 1].id;
    const result = await getFriendListData(lastId);
    if (!reload) setFriendList([...friendList, ...result]);
    else setFriendList(result);
  };

  const getStrangerList = async (reload = false) => {
    let lastId = null;
    if (!reload && strangerList.length > 0)
      lastId = strangerList[strangerList.length - 1].id;
    const result = await getStrangerListData(lastId);
    if (!reload) setStrangerList([...strangerList, ...result]);
    else setStrangerList(result);
  };

  const refreshList = async (reload, from) => {
    console.log("call from: ", from)
    if (selectedList.title == "Friend") {
      setIsLoading(true);
      await getFriendList(reload);
      setIsLoading(false);
    } else if (selectedList.title == "Stranger") {
      setIsLoading(true);
      await getStrangerList(reload);
      setIsLoading(false);
    }
  };

  const selectListToRender = () => {
    if (searchValue.trim() == "") {
      switch (selectedList.title) {
        case "Friend":
          return friendList;
        case "Stranger":
          return strangerList;
        case "Sent":
          return sentRequestList;
        case "Received":
          return receivedRequestList;
        default:
          return [];
      }
    }
    if (searchValue.trim() != "") {
      switch (selectedList.title) {
        case "Friend":
          return friendList.filter((fr) =>
            fr.displayName.toLowerCase().includes(searchValue.trim().toLowerCase())
          );
        case "Stranger":
          return strangerList.filter((str) =>
            str.displayName.toLowerCase().includes(searchValue.trim().toLowerCase())
          );
        case "Sent":
          return sentRequestList.filter((sent) =>
            sent.displayName.toLowerCase().includes(searchValue.trim().toLowerCase())
          );
        case "Received":
          return receivedRequestList.filter((rec) =>
            rec.displayName.toLowerCase().includes(searchValue.trim().toLowerCase())
          );
        default:
          return [];
      }
    }
  };

  const handleActionButtonClick = async (item) => {
    let result = false;
    switch (selectedList.title) {
      case "Friend":
        setViewUser(item);
        break;
      case "Stranger":
        result = await addRequest(item.id);
        if (result)
          showToast(
            "success",
            "Success",
            "Sent request to " + item.displayName
          );
        setIsLoading(true);
        await getStrangerList(true)
        setIsLoading(false);
        break;
      case "Sent":
        result = await removeRequest(item.reqId);
        if (result)
          showToast(
            "success",
            "Success",
            "Removed request for " + item.displayName
          );
        break;
      case "Received":
        result = await acceptReceivedRequest(item);
        if (result) {
          showToast(
            "success",
            "Success",
            `You and ${item.displayName} are friends now`
          );
          setIsLoading(true);
          await getFriendList(true);
          setIsLoading(false);
        }
        break;
      default:
        break;
    }
  };

  const handleUserPress = async (item) => {
    switch (selectedList.title) {
      case "Friend":
        const con = await openConversation(item.id);
        if (con) navigate("Message", { conversation: con, friendId: item.id, friendPhotoUrl: item.photoURL, friendName: item.displayName });
        else showToast("error", "Error", "Can not open conversation!");
        break;
      case "Stranger":
        setViewUser(item)
        break;
      case "Sent":
        setViewUser(item)
        break;
      case "Received":
        setViewUser(item)
        break;
      default: return;
    }
  }

  const renderUser = ({ item }) => {
    return (
      <Pressable style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        backgroundColor: theme.colors.background,
        justifyContent: "space-between",
      }} onPress={async () => { await handleUserPress(item) }}>
        {item.photoURL ? (
          <Avatar
            size={56}
            rounded
            source={{ uri: item.photoURL }}
            onPress={() => {
              setAvatarUrl(item.photoURL);
              setShowAvatar(true);
            }}
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
          <Text style={{ fontSize: 16 }}>{item.displayName}</Text>
          <Text style={{ fontSize: 14, color: theme.colors.grey3 }}>
            {selectedList.title == "Friend" || selectedList.title == "Stranger" ? item.email : new Date(item.sendTime.toDate()).toLocaleString()}
          </Text>
        </View>

        <Button
          buttonStyle={{
            justifyContent: "flex-end",
            flexGrow: 0,
            width: "auto",
            borderRadius: 10,
          }}
          titleStyle={{ fontSize: 14 }}
          color={selectedList.buttonColor}
          onPress={async () => {
            await handleActionButtonClick(item)
          }}
        >
          <Icon
            name={selectedList.buttonIcon}
            type="font-awesome"
            color={theme.colors.white}
            style={{ paddingRight: 5 }}
            size={20}
          />
          {selectedList.buttonText}
        </Button>
      </Pressable>
    );
  };

  if (viewUser) {
    return (
      <Profile
        user={viewUser}
        isFriend={selectedList.title == "Friend"}
        profileType={selectedList.title}
        subButton={{
          align: "flex-start",
          color: "warning",
          title: "Back",
          icon: "chevron-left",
          onPress: async () => {
            setViewUser(null);
            await getFriendList(true);
          },
        }}
      ></Profile>
    );
  }

  return (
    <SafeAreaView style={{ backgroundColor: theme.colors.background, flex: 1 }}>
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

      <View
        style={{
          paddingHorizontal: 10,
          flexDirection: "row",
          flexWrap: "wrap",
        }}
      >
        {listType.map((type, i) => {
          if (type.title == "Friend" || type.title == "Stranger") {
            return (
              <Chip
                key={i}
                title={type.title}
                containerStyle={{ padding: 3 }}
                color={
                  selectedList.title == type.title
                    ? theme.colors.primary
                    : theme.colors.grey3
                }
                onPress={() => setSelectedList(type)}
              />
            );
          }

          return (
            <View key={i}>
              <Chip
                title={type.title}
                containerStyle={{ padding: 3 }}
                color={
                  selectedList.title == type.title
                    ? theme.colors.primary
                    : theme.colors.grey3
                }
                onPress={() => setSelectedList(type)}
              />

              <Badge
                status="warning"
                value={type.title == "Sent" ? sentRequestList.length : receivedRequestList.length}
                containerStyle={{ position: "absolute", top: 0, right: 0 }}
              />
            </View>
          );
        })}
      </View>

      <FlatList
        data={selectListToRender()}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        onRefresh={() => refreshList(true, "flatlist on refressh")}
        refreshing={isLoading}
        onEndReached={(value) => {
          if (value.distanceFromEnd > 0) {
            console.log(value)
            refreshList(false, "flatlist on end reached")
          }
        }}
        onEndReachedThreshold={0.05}
        extraData={searchValue}
      />

      <Modal animationType="fade" transparent={true} visible={showAvatar}>
        <View style={{
          flex: 1,
          backgroundColor: "#000000BF"
        }}>
          <View style={{ flexShrink: 1, flexDirection: "row", justifyContent: "flex-end", padding: 10 }} >
            <Button
              type="clear"
              titleStyle={{ color: "white" }}
              onPress={() => {
                setShowAvatar(false);
              }}
            >
              <Icon name='remove'
                type='font-awesome'
                color={theme.colors.grey1} />
            </Button>
          </View>
          <View style={{ flexGrow: 1, justifyContent: "center", alignItems: "center" }} >
            <Image
              style={{ height: 400, width: 400, borderRadius: 5 }}
              resizeMode={"contain"}
              source={{ uri: avatarUrl }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView >
  );
});

export default Friend;
