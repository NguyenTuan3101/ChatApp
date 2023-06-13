import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";

const showToast = (type, title, message) => {
  Toast.show({
    type: type,
    text1: title,
    text2: message,
  });
};

const selectImage = async () => {
  let result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 4],
    quality: 1,
  });
  if (!result.cancelled) {
    return {
      name:
        Platform.OS === "android"
          ? result.uri
          : result.uri.replace("file://", ""),
      uri:
        Platform.OS === "android"
          ? result.uri
          : result.uri.replace("file://", ""),
      type: result.type,
    }
  }
};

export { showToast, selectImage };