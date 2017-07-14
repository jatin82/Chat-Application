package Server;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.concurrent.atomic.AtomicInteger;

import javax.websocket.EncodeException;
import javax.websocket.EndpointConfig;
import javax.websocket.OnClose;
import javax.websocket.OnError;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.ServerEndpoint;

import org.apache.juli.logging.Log;
import org.apache.juli.logging.LogFactory;


final class HTMLFilter {

/*    public static String filter(String message) {

        if (message == null)
            return (null);

        char content[] = new char[message.length()];
        message.getChars(0, message.length(), content, 0);
        StringBuffer result = new StringBuffer(content.length + 50);
        for (int i = 0; i < content.length; i++) {
            switch (content[i]) {
            case '<':
                result.append("&lt;");
                break;
            case '>':
                result.append("&gt;");
                break;
            case '&':
                result.append("&amp;");
                break;
            case '"':
                result.append("&quot;");
                break;
            default:
                result.append(content[i]);
            }
        }
        return (result.toString());
    }*/
}

@ServerEndpoint
(
	value = "/room",
	configurator = SocketConfig.class
)
public class Socket {

	/*private final class UserSession{
		public String name;
		public String sid;
		UserSession(String name,String sid){
			this.name = name;
			this.sid = sid;
		}
	}*/
	
	private static long groupID = 1L;
    private static final Log log = LogFactory.getLog(Socket.class);

    private static final HashMap<Long,ArrayList<String>> grp = new HashMap<Long,ArrayList<String>>();
    private static final HashMap<String,Socket> clients = new HashMap<String,Socket>();
//       
//    private Session session;
    private ArrayList<String> gid;
    private String usid ;
    private Session session;
//    
    public Socket() {
    	gid = new ArrayList<String>();
    	usid = null;
    }


    @OnOpen
    public void start(Session session,EndpointConfig config) throws EncodeException {
        String name = (String)config.getUserProperties().get("user");
    	long gid = 0L;
    	this.gid.add("room-"+gid);
        ArrayList<String> curGrp=null;
        if(!grp.containsKey(gid))
    	{
    		curGrp = new ArrayList<String>();
    		grp.put(gid,curGrp);
    	}
        curGrp= grp.get(gid);
        this.usid = name;//new UserSession(name,session.getId());
        curGrp.add(this.usid);
    	ArrayList<Particpant> part = new ArrayList<Particpant>();
    	for(String user:grp.get(gid)){
    		part.add(new Particpant(user,"add"));
    	}
    	Message msg = new Message();
    	msg.chatName="room";
    	msg.setGid(gid);
    	msg.setUid(name+"");
    	msg.setMessage("Joined");
    	msg.setParticpant(part);
    	String message = decode(msg);
    	// saving client
    	clients.put(name, this);
    	this.session = session;
        broadcast(message,curGrp);
    }

    private static final Message encode(String message){
    	Message msg = new Message();
    	msg.chatName = message.split(":::")[0].split("-")[0];
    	msg.setGid(Integer.parseInt(message.split(":::")[0].split("-")[1]));
        msg.setUid(message.split(":::")[1]);
        msg.setMessage(message.split(":::")[2]);
    	return msg;
    }
    
    private static final String decode(Message message){
    	String msg = message.chatName+"-"+message.getGid()+":::"+message.getUid()+":::"+message.getAllParticpantAndStatus()+":::"+message.getMessage();
    	return msg;
    }
    
    @OnClose
    public void end() throws EncodeException {
    	this.clients.remove(this.usid);
    	for(int i=0;i<gid.size();i++)
        {
    		long curGid = Long.parseLong(this.gid.get(i).split("-")[1]);
    		Message msg = new Message();
    		msg.chatName = this.gid.get(i).split("-")[0];
        	msg.setGid(curGid);
        	msg.setUid(this.usid);
        	msg.setMessage("Left Chat");
            
        	ArrayList<Particpant> part = new ArrayList<Particpant>();
            ArrayList<String> curUsid = grp.get(curGid);
            
            for(String x:curUsid){
            	if(x.equals(this.usid))
            		part.add(new Particpant(x,"remove"));
            	else
            		part.add(new Particpant(x,"add"));
            }
            
            grp.get(curGid).remove(this.usid);
        	msg.setParticpant(part);
        	String message = decode(msg);
        	broadcast(message,curUsid);
        }
    }
    
    private static final void registerUserToAllGroup(ArrayList<Particpant> part,String groupId){
    	for(Particpant x:part){
    		clients.get(x.getName()).gid.add(groupId);
    	}
    }
    private static final String decideName(String n1,String n2){
    	String temp="";
    	if(n1.compareTo(n2)<0)
    		temp+=n1+"_"+n2;
    	else
    		temp+=n2+"_"+n1;
    	return temp;
    }
    private static final Message encodeNewRequest(String message){
    	Message msg = new Message();
    	String[] tokens = message.split(":::");
    	ArrayList<Particpant> part = new ArrayList<Particpant>();
    	//its a personal chat
    	if(tokens[0].equals(">null")){
    		msg.chatName = decideName(tokens[1].split("-")[0],tokens[2].split("-")[0]);
    		part.add(new Particpant(tokens[1],"add"));
    		part.add(new Particpant(tokens[2],"add"));
    	}
    	// or its a group chat
    	else{
    		msg.chatName = tokens[0].substring(1, tokens[0].length());
    		String [] req = tokens[1].split("::");
    		for(String x:req)
    			part.add(new Particpant(x,"add"));
    		part.add(new Particpant(tokens[2],"add"));
    	}    	
    	msg.setGid(groupID);
    	msg.setUid(tokens[2]);
    	msg.setMessage(tokens[3]);
    	msg.setParticpant(part);
    	groupID++;
    	registerUserToAllGroup(part,msg.chatName+"-"+msg.getGid());
    	return msg;
    }
    
    private static final ArrayList<String> partToUsid(ArrayList<Particpant> part){
    	ArrayList<String> usid = new ArrayList<String>();
    	for(Particpant x:part){
    		usid.add(x.getName());
    	}
    	return usid;
    }
    private static final ArrayList<Particpant> usidToPart(ArrayList<String> usid){
    	ArrayList<Particpant> part = new ArrayList<Particpant>();
    	for(String x:usid){
    		part.add(new Particpant(x,"add"));
    	}
    	return part;
    }
    @OnMessage
    public void incoming(String message,Session session) throws EncodeException {
        Message msg;
        // check its a new request
        if(message.charAt(0)=='>'){
        	System.out.println("Request new");
        	msg = encodeNewRequest(message);
        	ArrayList<String> curUsid = partToUsid(msg.getParticpant());
        	grp.put(msg.getGid(),curUsid);
        }
        else
        	msg = encode(message);
        if(!msg.getMessage().equals(""))
        {
		    ArrayList<String> particpant;
		    particpant = grp.get(msg.getGid());
		    msg.setParticpant(usidToPart(particpant));
		    message = decode(msg);
			broadcast(message,particpant);
        }
    }
    @OnError
    public void onError(Throwable t) throws Throwable {
        log.error("Chat Error: " + t.toString(), t);
    }
    private static void broadcast(String msg,ArrayList<String> curGrp) throws EncodeException {
        for (String user : curGrp) {
            Socket clientSession = clients.get(user);
        	try {
                synchronized (user) {
                    clientSession.session.getBasicRemote().sendText(msg);
                }
            } catch (IOException e) {
                log.debug("Chat Error: Failed to send message to client", e);
                clients.remove(user);
                grp.remove(user);
                try {
                    clientSession.session.close();
                } catch (IOException e1) {
                    // Ignore
                }
            }
        }
    }
}
