import React, { useState, useEffect, useContext, useCallback } from 'react';
import { withTheme, Avatar, Text, Button } from '@rneui/themed';
import { GiftedChat, InputToolbar } from 'react-native-gifted-chat';
import UserContext from "../context";
import { sendMessage, getMessages, listenForNewMess, uploadImage } from '../firebase';
import { View, StyleSheet, KeyboardAvoidingView, Pressable, Platform, TextInput, Keyboard } from 'react-native';
import { showToast } from "../utils";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Fontisto, Feather, AntDesign } from '@expo/vector-icons';
import EmojiBoard from 'react-native-emoji-board'
import ImagePicker from 'react-native-image-picker';

const Message = withTheme(props => {
  const { theme } = props;
  const { navigate } = props.navigation;
  const { currentUser } = useContext(UserContext);
  const { conversation, friendId, friendPhotoUrl, friendName } = props.route.params;
  const [newMessage, setNewMessage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadEarlier, setLoadEarlier] = useState(true);
  const [inputText, setInputText] = useState("");
  //emoji picker
  const [show, setShow] = useState(false);
  const onClick = emoji => {
    console.log(emoji);
    setInputText((prevText) => prevText + emoji.code);
  };

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
  }, [conversation, friendId]);

  const onPress = useCallback(async () => {
    if (inputText) {
      const newMessage = {
        _id: Math.random().toString(),
        text: inputText,
        createdAt: new Date(),
        user: {
          _id: currentUser.uid,
          name: currentUser.displayName,
          avatar: currentUser.photoURL
        }
      };

      try {
        await onSend([newMessage]);
        setInputText("");
      } catch (error) {
        showToast("error", "Error", "Can not send message!");
      }
    } else {
      const newMessage = {
        _id: Math.random().toString(),
        text: "❤",
        createdAt: new Date(),
        user: {
          _id: currentUser.uid,
          name: currentUser.displayName,
          avatar: currentUser.photoURL
        }
      };
      await onSend([newMessage]);
      setInputText("");
    }
  }, [currentUser, inputText, onSend]);
  const customInputToolbar = props => {
    return (
      <InputToolbar
        {...props}
        containerStyle={{
          backgroundColor: "white",
          borderTopColor: "#E8E8E8",
          borderTopWidth: 1,
          padding: 8
        }}
        renderComposer={composerProps => (
          <View style={styles.inputContainer}>
            <Feather name="smile" size={24} color="#595959" style={styles.icon} onPress={() => setShow(!show)} />
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder='Signal message ...'
            />
            <Feather name="camera" size={24} color="#595959" style={styles.icon} />
            <Feather name="mic" size={24} color="#595959" style={styles.icon} />
          </View>
        )}
        renderSend={sendProps => (
          <Pressable style={styles.buttonContainer} onPress={onPress}>
            {inputText ? (
              <Feather name="send" size={21} color="white" />
            ) : (
              <AntDesign name="heart" size={24} color="white" />
            )}
          </Pressable>
        )}

      />

    );
  };
  const styles = StyleSheet.create({
    root: {
      flexDirection: 'row',
      padding: 10
    },
    inputContainer: {
      backgroundColor: '#f2f2f2',
      flex: 1,
      marginRight: 10,
      borderRadius: 25,
      borderWidth: 1,
      borderColor: '#dedede',
      alignItems: 'center',
      flexDirection: 'row',
      padding: 5
    },
    buttonContainer: {
      width: 40,
      height: 40,
      backgroundColor: '#3777F0',
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center'
    },
    buttonText: {
      color: 'white',
      fontSize: 35,
    },
    input: {
      flex: 3,
      marginHorizontal: 5,
      fontSize: 18
    },
    icon: {
      marginHorizontal: 5
    }
  });
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
        onSend={onSend}
        renderInputToolbar={customInputToolbar}
        onLoadEarlier={getMessageList}
        loadEarlier={loadEarlier}
        renderAvatarOnTop={true}
        user={{
          _id: currentUser.uid,
          name: currentUser.displayName,
          avatar: currentUser.photoURL
        }}
        onPress={() => setShow(show)}
      />
      <View>
        <EmojiBoard showBoard={show} onClick={onClick} />
      </View>

    </SafeAreaView>

  )
})
export default Message;