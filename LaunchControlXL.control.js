loadAPI(1);

host.defineController("Novation","LaunchControlXL","1.0",
                      "d9185a20-c531-11e6-9598-0800200c9a66");
host.defineMidiPorts(1,1);

function mapEvent(status,data1,data2) {
        
}

function closure(i,f) {
    return function(value) { f(i,value) }
}

var NUM_TRACKS=8,
    NUM_SENDS=2,
    NUM_SCENES=0,
    CNTL_SEND_A=0,
    CNTL_SEND_B=1,
    CNTL_PAN=2,
    CNTL_SLIDE=3,
    CNTL_FOCUS=4,
    CNTL_CONTROL=6;

function init()
{
    // create an object that will help map surface controls
    // to the appropriate track
    // channelGroup is the high level groups (note on, note off, etc)
    // channelId is the channel number within the group (e.g. 0-15)
    // 128-143 maps to [0,0-15]
    // 144-159 maps to [1,0-15]
    // etc.
    statusMap = {}
    for(var status=128; status < 240; status++) {
        statusMap[status] = {
            channelGroup: Math.floor((status-128)/16),
            channelId: status % 16
        }
    }

    // map the controller values to sends and tracks
    // track map contains channel group as top level object
    // each channel group object has data1:{controlTypeId:control type id,trackId:track id]
    trackMap = {}

    // Control/Mode change (status 176-191, channelGroup == 3) mapping
    // 13-20 - send a, control type id = 0
    // 29-36 - send b, control type id = 1
    // 49-56 - pan, control type id = 2
    // 77-84 - sliders, control type id = 3
    var starts = [13,29,49,77];
    cntl = trackMap[3] = {}
    for(var i=0; i < starts.length; i++) {
        start = starts[i];
        for(var j=0; j < NUM_TRACKS; j++) {
            cntl[start+j] = {controlTypeId:i,trackId:j};
        }
    }

    // Note on/ Note off (status 128-143 and 144-159, channelGroup in [0,1])
    // 41-60 - id:4 track focus
    // 73-92 - id:5 track control
    var starts = [41,73];
    noteon = trackMap[0] = {};
    noteoff = trackMap[1] = {};
    for(var i=0; i < starts.length; i++) {
        start = starts[i];
        for(var j=0; j < NUM_TRACKS; j++) {
            noteon[start+j] = noteoff[start+j] = {controlTypeId:i+4,trackId:j};
        }
    }
    /*
    for (var key in controllerRangeStarts) {
        trackMap[key] = {}
        for(var i in controllerRangeStarts[key]) {
            start = controllerRangeStarts[key][i];
            //println(start);
            for(var j=0; j < NUM_TRACKS; j++) {
                trackMap[key][start+j] = j;
                //println("mapping " + (start+j) + " to track " + j);
            }
        }
    }
    */

    trackBank = host.createTrackBank(NUM_TRACKS, NUM_SENDS, NUM_SCENES);
    /*
    for(var t=0; t<NUM_TRACKS; t++) {
        trackBank.getTrack(t).addNameObserver(8, "", closure(t,
            function (name) {
                println("Track " + t + " name: " + name);
            }
        )
        )
    }
    */

    //transport = host.createTransport();
    //userControls = host.createUserControls(8);

    host.getMidiInPort(0).setMidiCallback(onMidi);
}

function onMidi(status, data1, data2) {

    statusProps = statusMap[status];
    trackProps = trackMap[statusProps.channelGroup][data1];
    track = trackBank.getTrack(trackProps.trackId);

    /*
    println("status: " + status);
    println("data1: " + data1);
    println("data2: " + data2);

    println("channelGroup: " + statusProps.channelGroup);
    println("channelId: " + statusProps.channelId);

    println("controlTypeId: " + track.controlTypeId)
    println("trackId: " + track.trackId)
    */

    // factory is on channel 9
    if(statusProps.channelId == 8) {
        if(trackProps.controlTypeId == CNTL_SEND_A ||
           trackProps.controlTypeId == CNTL_SEND_B) {
            track.getSend(track.controlTypeId).set(data2,128);
        }
        else if(trackProps.controlTypeId == CNTL_PAN) {
            track.getPan().set(data2,128);
        }
        else if(trackProps.controlTypeId == CNTL_SLIDE) {
            track.getVolume().set(data2,128);
        }
        else if(trackProps.controlTypeId == CNTL_FOCUS) {
            track.selectInMixer();
        }
    }
}

function exit() {

}
