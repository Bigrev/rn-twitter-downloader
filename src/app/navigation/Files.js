import * as React from 'react';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Dimensions, FlatList, TouchableOpacity, Modal, TouchableWithoutFeedback, ImageBackground } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import FileViewer from 'react-native-file-viewer';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Footer from '../components/Footer';
const screen = Dimensions.get("screen");

const styles = StyleSheet.create({
    listElement: {
        flexDirection: "row",
        padding: 10,
        backgroundColor: "#cce5ff",
        height: screen.height / 8.5,
        marginTop: "2%",
        borderRadius: 10,
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingBottom: (screen.height / 13) - 1
    },
    popStyle: {
        width: screen.width,
        height: screen.height,
    }
});

function Files({ navigation }) {

    const [data, setData] = useState(null);
    const [popData, setPopData] = useState({ fileName: "", id:"", assetId:"", fileUri:""});
    const [modalVisible, setModalVisible] = useState(false);
    const [showText, setShowText] = useState(true);

    const modalAnimation = (name, id, assetId, fileUri, visible) => {
        if(visible){
            setModalVisible(true);
            setPopData({fileName: name, id: id, assetId: assetId, fileUri: fileUri});
        }else{
            setModalVisible(false);
            setPopData({fileName: "", id: "", assetId: "", fileUri: ""});
        }
    }

    const getData = async () => {
        let isSubscribed = true;
        try {
            const json = await AsyncStorage.getItem("@downloads");
            let query = json != null ? JSON.parse(json) : null;

            if (query != null) {
                query.sort((a, b) => (parseInt(a.id) < parseInt(b.id)) ? 1 : -1);
                setData(query)
                if(query.length > 0){
                    setShowText(false);
                }
                console.log(JSON.stringify(query, null, 4));
            }else{
                setShowText(true);
            }

        } catch (error) {
            console.log(error);
        }
        return () => isSubscribed = false;
    }

    useEffect(() => {
        getData();
    }, [])


    const promptPlayer = (uri) => {
        modalAnimation(null,null,null,false);
        let path = uri.substring(6);

        FileViewer.open(path, { showOpenWithDialog: true })
        .catch(error => console.log(error));
    }

    const deleteItem = async (key, assetId, fileName) => {
        try {
            await MediaLibrary.deleteAssetsAsync(assetId).then((bool) => {
                if (bool) {
                    console.log("media removed...");
                    AsyncStorage.getItem("@downloads", (err, res) => {
                        let query = JSON.parse(res);
                        let filtered = query.filter(obj => obj.id != key)
                        let newJson = JSON.stringify(filtered);
                        // FileSystem.deleteAsync(FileSystem.cacheDirectory + fileName, true);
                        AsyncStorage.setItem("@downloads", newJson, () => {
                            getData();
                            modalAnimation(null,null,null,false);
                        });
                    })
                }
            }).catch(() => {
                console.log("delete not authorized");
            })

        } catch (error) {
            console.log(error);
        }
    }

    function handleShare(){
        Sharing.shareAsync(popData.fileUri);
        modalAnimation(null,null,null,false);
    }

    return (
        <>
            <View style={styles.container}>
                {showText && <Text style={{position:"absolute", color:"black", fontSize:15, zIndex:100}}>Your downloaded videos will be shown here</Text>}
                {data &&
                    <FlatList
                        keyExtractor={(item) => item.id}
                        data={data}
                        style={{ flex: 1 }}
                        renderItem={({ item }) => (
                            <TouchableOpacity activeOpacity={0.7} onPress={() => promptPlayer(item.fileUri)} style={styles.listElement}>
                                <View style={{ width: "30%" }}>
                                    <ImageBackground source={{ uri: item.thumbnail }} style={{ height: "100%", width: "100%" }}>
                                        <Text style={{backgroundColor:"black", color:"white", opacity:0.7, position:"absolute", bottom:0, right:0}}>{` ${item.duration} `}</Text>
                                    </ImageBackground>
                                </View>

                                <View style={{ flexDirection: "column", width: "50%", marginLeft: "5%" }}>
                                    <View>
                                        <Text style={{ fontWeight: "bold" }}>
                                            {item.fileName}
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: "row", marginTop: "3%" }}>
                                        <MaterialCommunityIcons name="movie-open-outline" size={28} />
                                        <Text style={{ fontWeight: "bold", fontSize: 14, paddingTop: 6, paddingLeft: 6 }}>{item.filesize}</Text>
                                    </View>
                                </View>

                                <TouchableOpacity style={{ flexDirection: "column", width: "10%", marginLeft: "5%"}} onPress={()=> modalAnimation(item.fileName, item.id, item.assetId, item.fileUri, true)}>
                                    <View style={{ marginTop: "80%" }}>
                                        <MaterialCommunityIcons suppressHighlighting={false} name="dots-vertical" size={28} color="black" />
                                    </View>
                                </TouchableOpacity>
                            </TouchableOpacity>
                        )}
                    />
                }
            </View>

            <Footer homeColor={"grey"} filesColor={"white"} downloadColor={"grey"} navigation={navigation} />
   
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                hardwareAccelerated={true}
            >
                <TouchableOpacity style={{height: screen.height, width: screen.width}} onPressOut={()=>modalAnimation(null,null,null,false)}>
                    <View style={{backgroundColor:"black",height:screen.height, position:"absolute", width: screen.width, opacity:0.4}}/>
                    <TouchableWithoutFeedback style={{height:screen.height/2, width:screen.width, backgroundColor:"white", top: screen.height/1.5, borderTopRightRadius:10, borderTopLeftRadius:10}}>
                        <View style={{height:screen.height/2, width:screen.width, backgroundColor:"#191A1F", top: screen.height/1.65, borderTopRightRadius:10, borderTopLeftRadius:10}}>
                            <Text style={{color:"white", textAlign:"center", fontWeight:"bold",paddingTop:"3%"}}>{popData.fileName}</Text>
                            <View style={{flexDirection:"column", paddingTop:"8%", paddingLeft:"4%"}}>
                            <TouchableOpacity onPress={()=> promptPlayer(popData.fileUri)}>
                                    <View style={{flexDirection:"row"}}>
                                        <MaterialCommunityIcons name="play-circle-outline" size={screen.width/15} style={{color:"white"}}/>
                                        <Text style={{color:"white", fontWeight:"bold", fontSize:screen.width/21, paddingLeft:screen.width/30}}>Play video</Text>
                                    </View>    
                                </TouchableOpacity>
                                <TouchableOpacity onPress={()=> handleShare()} style={{paddingTop:"9%"}}>
                                    <View style={{flexDirection:"row"}}>
                                        <MaterialCommunityIcons name="share-variant" size={screen.width/15} style={{color:"white"}}/>
                                        <Text style={{color:"white", fontWeight:"bold", fontSize:screen.width/21, paddingLeft:screen.width/30}}>Share video</Text>
                                    </View>    
                                </TouchableOpacity>
                                <TouchableOpacity style={{paddingTop:"9%"}} onPress={()=>deleteItem(popData.id,popData.assetId, popData.fileName)}>
                                    <View style={{flexDirection:"row"}}>
                                        <MaterialCommunityIcons name="delete" size={screen.width/15} style={{color:"#FF4B4B"}}/>
                                        <Text style={{color:"#FF4B4B", fontWeight:"bold", fontSize:screen.width/21, paddingLeft:screen.width/30}}>Delete video</Text>
                                    </View>    
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </TouchableOpacity>

            </Modal>
        </>
    );
}

export default Files;