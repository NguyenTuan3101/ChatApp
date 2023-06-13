import React, { useState, useEffect, useContext, useCallback } from 'react'
import { withTheme, Avatar, Text, Button } from '@rneui/themed';
import { GiftedChat } from 'react-native-gifted-chat'
import UserContext from "../context";
import { sendMessage, getMessages, listenForNewMess } from '../firebase';
import { View } from 'react-native';
import { showToast } from "../utils";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

const Message = withTheme(props => {
  const { theme } = props;
  const { navigate } = props.navigation;
  const { currentUser } = useContext(UserContext);
  const { conversation, friendId, friendPhotoUrl, friendName } = props.route.params;
  const [newMessage, setNewMessage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadEarlier, setLoadEarlier] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      await getMessageList();
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (newMessage) {
      const found = messages.find(mess => mess._id == newMessage._id)
      if (!found) setMessages([newMessage, ...messages])
    }
  }, [newMessage])

  useFocusEffect(
    React.useCallback(() => {
      const unsub = listenForNewMess(conversation.conId, setNewMessage);
      return () => {
        unsub();
      };
    }, [])
  );

  const getMessageList = async () => {
    let lastId = null;
    if (messages.length > 0) lastId = messages[messages.length - 1]._id;
    const result = await getMessages(conversation.conId, lastId);
    if (result.length < 20) setLoadEarlier(false)
    setMessages([...messages, ...result]);
  }

  const onSend = useCallback(async (messages = []) => {
    const newMessage = messages[0];
    const result = await sendMessage(conversation, newMessage.text, friendId);
    if (!result) showToast("error", "Error", "Can not send message!");
  }, [])

  return (
    <SafeAreaView style={{ width: '100%', height: "100%", backgroundColor: theme.colors.white }}>
      <View style={{ flexDirection: "row", padding: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.greyOutline, alignItems: 'center' }}>
        <Button
          onPress={() => { navigate("Tabs") }}
          icon={{
            name: "chevron-left",
            type: "font-awesome",
            color: theme.colors.grey2,
            size: 26,
          }}
          type="clear" ></Button>

        {friendPhotoUrl ? (
          <Avatar
            rounded
            source={{ uri: friendPhotoUrl }}
            containerStyle={{
              backgroundColor: theme.colors.grey0,
              borderColor: theme.colors.greyOutline,
              borderStyle: "solid",
              borderWidth: 1,
            }}
          />
        ) : (
          <Avatar
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
        <Text style={{ fontSize: 20, paddingStart: 20 }}>{friendName}</Text>
      </View>
      <GiftedChat
        messages={messages}
        onSend={messages => onSend(messages)}
        onLoadEarlier={getMessageList}
        loadEarlier={loadEarlier}
        renderAvatarOnTop={true}
        user={{
          _id: currentUser.uid,
          name: currentUser.displayName,
          avatar: currentUser.photoURL
        }}
      />
    </SafeAreaView>
  )
})
export default Message;