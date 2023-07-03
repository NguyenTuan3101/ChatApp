import { initializeApp } from 'firebase/app';
import { getAuth, updateProfile } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getFirestore, query, where, collection, getDocs, limit, startAfter, addDoc, serverTimestamp, getDoc, runTransaction, deleteDoc, onSnapshot, arrayRemove, arrayUnion, orderBy } from "firebase/firestore";

//iOS: 731270731716-1s0h84j24ul0jkfpr2q5cbt2hipj3ss8.apps.googleusercontent.com
//android: 731270731716-i8por7jf3gouqc2fl5562ct52r6tohv3.apps.googleusercontent.com
const firebaseConfig = {
    apiKey: "AIzaSyAlUDWp2F7vDDxHx_9tWJnPZ-SMfQblN1Y",
    authDomain: "chat-social-app.firebaseapp.com",
    databaseURL: "https://chat-social-app-default-rtdb.firebaseio.com",
    projectId: "chat-social-app",
    storageBucket: "chat-social-app.appspot.com",
    messagingSenderId: "790339047763",
    appId: "1:790339047763:web:80fd6385372940803a91a6"
  };
  

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);
const db = getFirestore(app);

const usersColRef = collection(db, "users");
const requestsColRef = collection(db, "requests");
const messageColRef = collection(db, "messages");

const itemsPerPage = 8;

const uploadImage = async (path, imageUri) => {
    if (imageUri) {
        const storageRef = ref(storage, path);
        const localFile = await fetch(imageUri);
        const fileBlob = await localFile.blob();
        try {
            await uploadBytes(storageRef, fileBlob)
            const url = await getDownloadURL(storageRef);
            return url;
        } catch (error) {
            console.error(error);
            return null;
        }
    }
    return null;
};

const getFriendListData = async (lastId) => {
    let result = [];

    const friendsDoc = await getDoc(doc(db, "friends", auth.currentUser.uid));
    if (friendsDoc.exists()) {
        const friendsData = friendsDoc.data();
        const friendsList = friendsData.list;

        if (friendsList.length > 0) {
            let friendQuery = query(usersColRef, where("__name__", "in", friendsList), limit(itemsPerPage))

            if (lastId) {
                let lastDoc = await getDoc(doc(db, "users", lastId));
                friendQuery = query(usersColRef, where("__name__", "in", friendsList), limit(itemsPerPage), startAfter(lastDoc))
            }

            const querySnapshot = await getDocs(friendQuery);
            querySnapshot.forEach((doc) => {
                result.push({ ...doc.data(), id: doc.id })
            });
        }
    }
    return result;
}

const getStrangerListData = async (lastId) => {
    let result = [];

    let excludeIdList = [auth.currentUser.uid];
    let friendDoc = await getDoc(doc(db, "friends", auth.currentUser.uid));
    if (friendDoc.exists()) {
        const friendList = friendDoc.data().list;
        if (friendList.length > 0) excludeIdList = [...excludeIdList, ...friendList]
    }

    const userRequestDoc = await getDoc(doc(db, "userRequests", auth.currentUser.uid));
    if (userRequestDoc.exists()) {
        const sentToUsers = userRequestDoc.data().sentToUsers;
        const receivedFromUsers = userRequestDoc.data().receivedFromUsers;

        if (sentToUsers && sentToUsers.length > 0) excludeIdList = [...excludeIdList, ...sentToUsers]
        if (receivedFromUsers && receivedFromUsers.length > 0) excludeIdList = [...excludeIdList, ...receivedFromUsers]
    }

    let queryConstraints = [where("__name__", "not-in", excludeIdList), limit(itemsPerPage)]
    if (lastId) {
        const lastDoc = await getDoc(doc(db, "users", lastId));
        queryConstraints.push(startAfter(lastDoc));
    }
    let strangerQuery = query(usersColRef, ...queryConstraints);

    const querySnapshot = await getDocs(strangerQuery);
    querySnapshot.forEach((doc) => {
        result.push({ ...doc.data(), id: doc.id })
    });
    return result;
}

const getRequestList = (setSentList, setReceivedList) => {
    let sentList = [];
    let receivedList = [];
    const unsub = onSnapshot(doc(db, "userRequests", auth.currentUser.uid), async (userRequestDoc) => {

        const userRequestData = userRequestDoc.data();
        if (userRequestData) {
            const receivedRequests = userRequestDoc.data().receivedRequests;
            const sentRequests = userRequestDoc.data().sentRequests;

            sentList = receivedList = await Promise.all(sentRequests.map(async (reqId) => {
                const requestDoc = await getDoc(doc(db, "requests", reqId));
                if (requestDoc.exists()) {
                    const requestData = requestDoc.data();
                    const userDoc = await getDoc(requestData.toUserRef);
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        return { ...requestData, ...userData, reqId: reqId, userId: userDoc.id, id: reqId }
                    }
                }
                return null;
            }))

            receivedList = await Promise.all(receivedRequests.map(async (reqId) => {
                const requestDoc = await getDoc(doc(db, "requests", reqId));
                if (requestDoc.exists()) {
                    const requestData = requestDoc.data();
                    const userDoc = await getDoc(requestData.fromUserRef);
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        return { ...requestData, ...userData, reqId: reqId, userId: userDoc.id, id: reqId }
                    }
                }
                return null;
            }))
        }
        setSentList(sentList);
        setReceivedList(receivedList);
    });
    return unsub;
}

const addRequest = async (toId) => {
    const newRequestDocRef = await addDoc(requestsColRef, {});
    try {
        await runTransaction(db, async (transaction) => {
            const fromUserRequestRef = doc(db, "userRequests", auth.currentUser.uid);
            const fromUserRequestDoc = await transaction.get(fromUserRequestRef);
            const toUserRequestRef = doc(db, "userRequests", toId);
            const toUserRequestDoc = await transaction.get(toUserRequestRef);

            transaction.update(newRequestDocRef, {
                fromUserRef: doc(db, "users", auth.currentUser.uid),
                toUserRef: doc(db, "users", toId),
                sendTime: serverTimestamp(),
            });

            if (fromUserRequestDoc.exists()) {
                transaction.update(fromUserRequestRef, {
                    sentToUsers: arrayUnion(toId),
                    sentRequests: arrayUnion(newRequestDocRef.id)
                })
            } else {
                transaction.set(fromUserRequestRef, {
                    sentToUsers: arrayUnion(toId),
                    sentRequests: arrayUnion(newRequestDocRef.id),
                    receivedFromUsers: [],
                    receivedRequests: [],
                })
            }

            if (toUserRequestDoc.exists()) {
                transaction.update(toUserRequestRef, {
                    receivedFromUsers: arrayUnion(auth.currentUser.uid),
                    receivedRequests: arrayUnion(newRequestDocRef.id),
                })
            } else {
                transaction.set(toUserRequestRef, {
                    receivedFromUsers: arrayUnion(auth.currentUser.uid),
                    receivedRequests: arrayUnion(newRequestDocRef.id),
                    sentToUsers: [],
                    sentRequests: [],
                })
            }


        });
        console.log("Add request successfully!");
        return true;
    } catch (e) {
        await deleteDoc(newRequestDocRef);
        console.log("Add request failed: ", e);
        return false;
    }
}

const removeRequest = async (requestId) => {
    try {
        await runTransaction(db, async (transaction) => {
            const requestRef = doc(db, "requests", requestId);
            const requestData = (await transaction.get(requestRef)).data();

            const fromUserRef = requestData.fromUserRef
            const fromUserDoc = await transaction.get(fromUserRef);

            const fromUserReqRef = doc(db, "userRequests", fromUserDoc.id);

            const toUserRef = requestData.toUserRef
            const toUserDoc = await transaction.get(toUserRef);

            const toUserReqRef = doc(db, "userRequests", toUserDoc.id);

            transaction.delete(requestRef);
            transaction.update(fromUserReqRef, { sentToUsers: arrayRemove(toUserDoc.id), sentRequests: arrayRemove(requestId) })

            transaction.update(toUserReqRef, { receivedFromUsers: arrayRemove(fromUserDoc.id), receivedRequests: arrayRemove(requestId) });
        })
        console.log("Remove request successfully!")
        return true;
    } catch (error) {
        console.log("Remove request failed: ", error);
        return false;
    }
}

const acceptReceivedRequest = async (request) => {
    try {

        await runTransaction(db, async (transaction) => {
            const fromUserDoc = await transaction.get(request.fromUserRef);
            const fromUserReqRef = doc(db, "userRequests", fromUserDoc.id);
            const fromFriendRef = doc(db, "friends", fromUserDoc.id);
            const fromFriendDoc = await transaction.get(fromFriendRef);

            const toUserDoc = await transaction.get(request.toUserRef);
            const toUserReqRef = doc(db, "userRequests", toUserDoc.id);
            const toFriendRef = doc(db, "friends", toUserDoc.id);
            const toFriendDoc = await transaction.get(toFriendRef);

            transaction.delete(doc(db, "requests", request.reqId));

            transaction.update(fromUserReqRef, { sentRequests: arrayRemove(request.reqId), sentToUsers: arrayRemove(toUserDoc.id) })
            transaction.update(toUserReqRef, { receivedRequests: arrayRemove(request.reqId), receivedFromUsers: arrayRemove(fromUserDoc.id) });

            if (fromFriendDoc.exists()) transaction.update(fromFriendRef, { list: arrayUnion(request.toUserRef) })
            else transaction.set(fromFriendRef, { list: [request.toUserRef] })

            if (toFriendDoc.exists()) transaction.update(toFriendRef, { list: arrayUnion(request.fromUserRef) })
            else transaction.set(toFriendRef, { list: [request.fromUserRef] })
        })

        console.log("Accept request successfully!");
        return true;
    } catch (error) {
        console.log("Accept request failed: ", error);
        return false;
    }
}

const unfriend = async (friendId) => {
    try {
        await runTransaction(db, async (transaction) => {
            const currentUserRef = doc(db, "friends", auth.currentUser.uid);
            const friendRef = doc(db, "friends", friendId);

            transaction.update(currentUserRef, { list: arrayRemove(doc(db, "users", friendId)) })
            transaction.update(friendRef, { list: arrayRemove(doc(db, "users", auth.currentUser.uid)) })
        })

        console.log("Unfriend successfully!");
        return true
    } catch (error) {
        console.log("Unfriend failed: ", error);
        return false
    }
}

const openConversation = async (friendId) => {
    try {
        const conQuery = query(
            collection(db, "conversations"),
            where(`members.${auth.currentUser.uid}`, "==", true),
            where(`members.${friendId}`, '==', true),
            limit(1)
        )

        let con = null;
        const querySnapshot = await getDocs(conQuery);
        querySnapshot.forEach(doc => { con = { conId: doc.id, ...doc.data() } });

        if (!con) {
            const conRef = doc(collection(db, "conversations"));
            con = { members: {}, lastMessage: null, conId: conRef.id };
            con.members[auth.currentUser.uid] = true;
            con.members[friendId] = true;
            await setDoc(conRef, con);
        } else {
            await updateSeenConversation(con.conId);
        }

        console.log("Open conversation successfully!");
        return con;
    } catch (error) {
        console.log("Open conversation failed: ", error)
        return null;
    }
}

const updateSeenConversation = async (conId) => {
    const userConRef = doc(db, "userConversations", auth.currentUser.uid);
    const userConDoc = await getDoc(userConRef);
    if (userConDoc.exists()) {
        let conList = userConDoc.data().list;
        let isUpdated = false
        conList.forEach(c => {
            if (c.conId == conId) {
                c.seen = true;
                isUpdated = true;
            }
        })
        if (isUpdated) {
            await setDoc(userConRef, { list: conList })
        }
    }
}

const sendMessage = async (con, text, friendId) => {
    try {
        await runTransaction(db, async (transaction) => {
            const messageRef = doc(collection(db, "messages"));
            const conRef = doc(db, "conversations", con.conId);
            const conDoc = await transaction.get(conRef);
            const userUcRef = doc(db, "userConversations", auth.currentUser.uid);
            const userUcDoc = await transaction.get(userUcRef);
            const friendUcRef = doc(db, "userConversations", friendId);
            const friendUcDoc = await transaction.get(friendUcRef);
            const friendDoc = await transaction.get(doc(db, "users", friendId));

            const newMessage = {
                _id: messageRef.id,
                text,
                createdAt: serverTimestamp(),
                user: {
                    _id: auth.currentUser.uid,
                    name: auth.currentUser.displayName,
                    avatar: auth.currentUser.photoURL
                },
                conId: con.conId
            }

            transaction.set(messageRef, newMessage)

            if (conDoc.exists()) transaction.update(conRef, { lastMessage: messageRef.id })
            else transaction.set(conRef, con);

            const userUcTempData = {
                conId: conRef.id,
                frId: friendId,
                frName: friendDoc.data().displayName,
                lastMessText: newMessage.text,
                lastMessCreatedAt: new Date().toLocaleString(),
                photoURL: friendDoc.data().photoURL,
                seen: true
            };

            if (userUcDoc.exists()) {
                let userConList = userUcDoc.data().list;
                let found = userConList.findIndex(con => con.conId == userUcTempData.conId)
                if (found > -1) userConList[found] = userUcTempData;
                else userConList.push(userUcTempData);
                transaction.update(userUcRef, { list: userConList })
            }
            else transaction.set(userUcRef, { list: [userUcTempData] }, auth.currentUser.uid)

            const friendUcTempData = {
                conId: conRef.id,
                frId: auth.currentUser.uid,
                frName: auth.currentUser.displayName,
                lastMessText: newMessage.text,
                lastMessCreatedAt: new Date().toLocaleString(),
                photoURL: auth.currentUser.photoURL,
                seen: false
            }

            if (friendUcDoc.exists()) {
                let friendConList = friendUcDoc.data().list;
                let found = friendConList.findIndex(con => con.conId == friendUcTempData.conId)
                if (found > -1) friendConList[found] = friendUcTempData;
                else friendConList.push(friendUcTempData)
                transaction.update(friendUcRef, { list: friendConList })
            }
            else transaction.set(friendUcRef, { list: [friendUcTempData] })
        });

        console.log("Send message successfully!");
    } catch (error) {
        console.log("Send message failed: ", error);
        return false;
    }
    return true;
}

const getMessages = async (conId, lastId) => {
    const result = [];

    let messageQuery = query(messageColRef, where("conId", "==", conId), orderBy("createdAt", "desc"), limit(20));
    if (lastId) {
        const lastDoc = await getDoc(doc(db, "messages", lastId));
        messageQuery = query(messageColRef, where("conId", "==", conId), orderBy("createdAt", "desc"), startAfter(lastDoc), limit(20));
    }

    const querySnapshot = await getDocs(messageQuery);
    querySnapshot.forEach((doc) => {
        const messageData = doc.data();
        result.push({ ...messageData, createdAt: messageData.createdAt.toDate() })
    });

    result.sort((a, b) => b.createdAt - a.createdAt)
    return result;
}

const listenForNewMess = (conId, setNewMessage) => {
    const unsub = onSnapshot(doc(db, "conversations", conId), async (conDoc) => {
        if (conDoc.exists()) {
            const conData = conDoc.data();
            const lastMessageId = conData.lastMessage;
            if (lastMessageId) {
                const lastMessageDoc = await getDoc(doc(db, "messages", lastMessageId));
                if (lastMessageDoc.exists()) {
                    const lastMessageData = lastMessageDoc.data();
                    const lastMessage = { ...lastMessageData, createdAt: lastMessageData.createdAt.toDate() }
                    setNewMessage(lastMessage);
                    if (lastMessage.user.name != auth.currentUser.displayName) {
                        await updateSeenConversation(conId)
                    }
                }
            }
        }
    });
    return unsub;
}

const listenForConversations = (setConversations) => {
    const unsub = onSnapshot(doc(db, "userConversations", auth.currentUser.uid), async (ucDoc) => {
        const ucData = ucDoc.data();
        if (ucData) setConversations(ucData.list);
    });
    return unsub;
}

const updateUser = async (newInfor) => {
    try {
        await updateProfile(auth.currentUser, newInfor);
        const data = auth.currentUser.providerData[0];
        await setDoc(doc(db, "users", auth.currentUser.uid), { displayName: data.displayName, email: data.email, photoURL: data.photoURL });
        return auth.currentUser;
    } catch (error) {
        console.log(error);
        return null;
    }
}

export { auth, storage, uploadImage, getFriendListData, getStrangerListData, addRequest, removeRequest, getRequestList, acceptReceivedRequest, unfriend, openConversation, sendMessage, getMessages, listenForNewMess, listenForConversations, updateUser };