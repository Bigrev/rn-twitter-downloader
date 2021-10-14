import * as React from 'react';
import {useEffect, useState, useRef} from 'react';
import { FileSystem } from 'react-native-unimodules'
import * as MediaLibrary from 'expo-media-library';
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as Progress from 'react-native-progress';
import { Provider, TextInput, Button, List, Surface } from 'react-native-paper';
import InAppReview from 'react-native-in-app-review';

import { StyleSheet, Text, View, Dimensions, Alert, Animated, ScrollView, ImageBackground, TouchableOpacity, PermissionsAndroid } from 'react-native';
import { AnimatedBackgroundColorView } from 'react-native-animated-background-color-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Footer from '../components/Footer';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop:20,
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
});

function Homescreen({navigation}){

    const [url, setUrl] = useState("");
    const [bgColor, setBgColor] = useState("#fdf2fd");
    const [btnColor, setBtnColor] = useState("black");
    const [thumbLink, setThumbLink] = useState(null);
    const [fileName, setFileName] = useState(null);
    const [options, setOptions] = useState(null);
    const [icon, setIcon] = useState(null);
    const [error, setError] =  useState(null);
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [thumbImage, setThumbImage] = useState(null);
    const [currentFileName, setCurrentFileName] = useState(null);
    const [downloadProgress, setDownloadProgress] = useState(null);
    const [isDownloading, setIsDownloading] =  useState(false);
    const [showCheck, setShowCheck] = useState(false);
    const [editableUrl, setEditableUrl] =  useState(true);
    const [appOpened, setAppOpened] = useState(null);
    const screen = Dimensions.get("screen");
    const linkImput = useRef();

    const appStartID= "ca-app-pub-1546749977608985/6511902721";

    function getIdByUrl(twitterUrl){
      let afterSlash = twitterUrl.split('status/')[1];
      if(afterSlash.includes("?")){
        return afterSlash.split('?')[0]
      }
      else{
        return afterSlash
      }
    }

    const generateThumbnail = async (url) => {
      try {
        const { uri } = await VideoThumbnails.getThumbnailAsync(url);
        setThumbImage(uri);
        setVisible(true);
        setLoading(false);
        setEditableUrl(true);
        console.log(JSON.stringify(options, null, 4))
      } catch (error) {
        console.warn(error);
      }
    }

    const timesOpened = async () =>{
      try {
        const value = await AsyncStorage.getItem("@timesOpened");
        if(value !== null){
          let storeThis = (parseInt(value)+1).toString();
          setAppOpened(storeThis);
          console.log("storing opened app: "+storeThis);
          await AsyncStorage.setItem("@timesOpened", storeThis);
        }else{
          await AsyncStorage.setItem("@timesOpened", "1");
          console.log("storing opened app: "+1);
        }
      } catch (error) {
        console.warn(error);
      }
    }

    const storeData = async (newObj) =>{
      let newArr = [];
      try {
        const jsonValue =  await AsyncStorage.getItem("@downloads");
        let oldObj = jsonValue != null? JSON.parse(jsonValue) : null;

        if(oldObj){
          //store new
          console.log("im storing new");
          newObj.id = oldObj.length ? (parseInt(oldObj[oldObj.length -1].id) + 1).toString() : "1";
          oldObj.push(newObj);
          const newJson = JSON.stringify(oldObj);
          AsyncStorage.setItem("@downloads", newJson);

        }else{
          //storing first time 
          console.log("im storing first");
          newObj.id = "1";
          newArr.push(newObj);
          const newJson = JSON.stringify(newArr);
          AsyncStorage.setItem("@downloads", newJson)
        }

      } catch (error) {
        console.log(error);
      }
    };

    function reset () {
      setBgColor("#fdf2fd");
      setBtnColor("black");
      setOptions(null);
      setVisible(false);
      setIcon(null);
      setError(null);
      setThumbImage(null);
      setCurrentFileName(null);
      setIsDownloading(false);
      setShowCheck(false);
      linkImput.current.clear();
      setUrl("");
      console.log("color changed to default");
    }

    const callback = (downloadProgress) => {
      if(!isDownloading){
        setIsDownloading(true);
      }
      const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
      if(progress == 1){
        setDownloadProgress(null);
        setIsDownloading(false);
        setShowCheck(true);
        setTimeout(()=>{
          const rateAvailable = InAppReview.isAvailable();
          console.log("rate is available: "+rateAvailable);
          console.log("app opened this times : "+ appOpened);
          setEditableUrl(true);
          reset();
          if(appOpened == 3 && rateAvailable){
            console.log("i should be showing review APP XDDDD");
            InAppReview.RequestInAppReview();
          }
        },1500)
      }else{
        setDownloadProgress(progress)
      }
      console.log(progress);
    };
    
      async function downloadVideo(url) {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE, {
          title: "Storage Permission Required",
          message:
            "In order to download videos, this app requires the permission to store them on your device, so a prompt will show now, if you deny it, the permissions can be managed later from your phone permission section inside Settings",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK"
        });
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setEditableUrl(false);
          let fileName = `${currentFileName}_${Date.now()}.mp4`;
          let fileUri = `${FileSystem.documentDirectory}${fileName}`;

            const saveFile = async (fileUri) => {
                  const asset = await MediaLibrary.createAssetAsync(fileUri);

                  FileSystem.getInfoAsync(fileUri).then((obj)=>{
                  let size = `${(((obj.size)/1000000).toFixed(2)).toString()} MB`;
                  let fileObj = {
                    "assetId": asset.id,
                    "fileName": fileName,
                    "fileUri": fileUri,
                    "fileUrl": url,
                    "thumbnail": thumbImage,
                    "filesize": size
                    };

                  MediaLibrary.getAssetInfoAsync(asset.id).then(assetObj =>{
                    let duration =  (new Date(assetObj.duration * 1000).toISOString().substr(11, 8)).substring(3);
                    fileObj["duration"] = duration;
                    }).then(()=>{
                    storeData(fileObj);
                    console.log("info saved");
                    });
                  })
                  console.log("video Downloaded!");
              }
            

            const downloadResumable = FileSystem.createDownloadResumable(url, fileUri, {}, callback);

            try {
              (async () =>{
                const {uri} = await downloadResumable.downloadAsync();
                saveFile(uri);
              })();
            } catch (error) {
              setError("Please check your internet connection and try again");
              console.log(error);
            }
        }
          
      }

    function getDimension (url) {
      let test = url;
      let reg = test.match(/(([\d ]{2,5}[x][\d ]{2,5}))/);
      if(reg){
        return reg[0];
      }
      else{
        return "GIF"
      }
    }
 
    function getLinks () {
        if(url != null && url != ""){
          setLoading(true);
          setEditableUrl(false);
          
          (async () =>{

            let mediaId = getIdByUrl(url)
            console.log(url)
            console.log(mediaId)
            const baseUrl = "https://api.twitter.com/1.1/statuses/show.json";
            const params = new URLSearchParams();
            params.append('id', mediaId);
            params.append('tweet_mode',"extended");

            //TWITER API TOKEN GOES HERE!!!
            try {
              let response = await fetch(`${baseUrl}?${params}`,{
                headers:{
                  'Authorization':'API TWITTER TOKEN GOES HERE!!!'
                }
              });
              response = await response.json();
              console.log(JSON.stringify(response,null, 4))

              const variants = await response.extended_entities.media[0].video_info.variants;

              let linkForThumb = variants[0].bitrate != undefined ? variants[0].url : variants[1].url;
              setThumbLink(linkForThumb);
              let currentFileName = response.user.screen_name;
              setFileName(currentFileName);

              let newArr = [];
              let quality = ["Best Quality","Mid Quality","Low Quality"];

              variants.forEach((option, index) =>{
                if(option.content_type === "video/mp4"){
                  let dimension = getDimension(option.url);
                  newArr.push({"dimension": dimension, "url": option.url});
                }
                if(index === variants.length -1){
                  if(newArr.length > 1){
                    newArr.sort((a, b) => (parseInt(a.dimension) < parseInt(b.dimension)) ? 1 : -1);
                  }
                  newArr.forEach((obj, index) =>{
                    obj["quality"] = quality[index]
                    obj["key"] = index;
                    if(index === newArr.length-1){
                        setOptions(newArr);
                    }
                  })
                }
              });

            } catch (err) {
              console.log(err)
                setError("No video media found, please check the url and try again");
                setLoading(false);
                setVisible(false);
            }
          })();
        }
      }

    const createAlert = () =>{
        Alert.alert("Error",
        error, [
          {text: "OK", onPress: () => setError(null)}
        ], {cancelable: false}
        )
    }

    useEffect(()=>{

        if(error != null){
          createAlert();
        }
        
    }, [error])

    useEffect(()=>{

      if(options != null && options.length > 0){
        generateThumbnail(thumbLink);
        setCurrentFileName(fileName);
        setError(null);
      }

    },[options])

    //Manage colors and states on Url input
    useEffect(()=>{
        if((url.toLowerCase()).includes("twitter")){
        setBgColor("#1d8eee");
        setBtnColor("white");
        setIcon("twitter");
        console.log("color changed to twitter")
        }
        if(url === ""){
          reset();
        }
    }, [url])

    //count app opened times to show App review modal
    useEffect(()=>{
      timesOpened();
      (async ()=>{
        await AdMobInterstitial.setAdUnitID(appStartID);
        await AdMobInterstitial.requestAdAsync({servePersonalizedAds: false});
        await AdMobInterstitial.showAdAsync();
      })();
    }, [])

    return(
    <Provider>
      
      <AnimatedBackgroundColorView  initialColor='#666666' color={bgColor} style={{height:screen.height, width: screen.width}}>
        <ScrollView keyboardShouldPersistTaps='handled' contentContainerStyle={styles.container}>

          <Animated.View style={{height:"7%"}}>
            <MaterialCommunityIcons name={icon} size={42} color="white"/>
          </Animated.View>
          <TextInput ref={linkImput} editable={editableUrl} placeholderTextColor={"grey"} placeholder={"Link to Twitter's post with video"} style={{ width:"90%", borderRadius: 5, borderColor:"black", borderWidth:2}} theme={{colors:{background:"white", text:"black", primary: 'black'}}} onChangeText={url => setUrl(url)}/>

          <Button onPress={ getLinks } color={btnColor} mode="contained" loading={loading} style={{ marginTop:20 }}>
            <Text>Search</Text>
          </Button>
          
          {visible && 
            <Surface style={ {marginTop:"5%", width:"60%", elevation:8} }>
              <View style={ {backgroundColor:bgColor} }>
                <List.Section>
                  <List.Subheader style={ {textAlign:"center", color:"black", fontWeight:"bold"} }>
                    Available video sizes
                  </List.Subheader>
                </List.Section>
                  <View style={{flexDirection: "column"}}>
                    {thumbImage && 
                    <ImageBackground source={{uri: thumbImage}} style={ {width: 160, height: 90, marginLeft: "auto", marginRight: "auto"} }/>
                    }
                    {(options && (!isDownloading && !showCheck)) && options.map((option) =>{
                      return(
                        <TouchableOpacity style={{padding: 12}} key={option.key} onPress={ ()=> downloadVideo(option.url, option.key) }>
                          <View style={{flexDirection:"row"}}>
                            <MaterialCommunityIcons size={32} style={{width:"20%"}} color="black" name="download"/>
                            <Text style={{fontWeight:"bold", fontFamily:"roboto", width:"60%", textAlign:"center"}}>{option.dimension != "GIF" ? option.quality : "GIF"}</Text>
                          </View>
                        </TouchableOpacity>
                      )
                    })}
                    
                    {isDownloading && 
                    <View style={{justifyContent: 'center', 
                    alignItems: 'center', padding:10 }}>
                    <Progress.Circle progress={downloadProgress} showsText={true} style={{marginLeft:"3.3%"}} color={"white"} size={screen.width/2.5}/>
                    </View>
                    }
                    {showCheck && 
                    <View style={{justifyContent: 'center', 
                    alignItems: 'center', padding: 10 }}>
                    <MaterialCommunityIcons size={screen.width/2.55} style={{marginLeft:"3.3%"}} color="white" name="check-bold"/>
                    </View>
                    }
                  </View>
                
              </View> 
            </Surface>
          }
          
        </ScrollView>
      </AnimatedBackgroundColorView>
      
      <Footer homeColor={"white"} filesColor={"grey"} downloadColor={"grey"} navigation={navigation} />

    </Provider>
    )
}


export default Homescreen;