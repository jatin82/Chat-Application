package Server;


// optimization needed in particpant
import java.util.ArrayList;
import java.util.Map;

public class Message {
	private long gid;
	private String uid;
	private ArrayList<Particpant> particpant;
	private String message;
	public String chatName=null;
	
	Message(){
		message="";
		uid = "";
		gid = 0;
		particpant = new ArrayList<Particpant>();
	}
	Message(long gid,String uid,String message){
		this.gid = gid;
		this.message = message;
		this.uid = uid;
	}
	
	public long getGid() {
		return gid;
	}
	public void setGid(long gid) {
		this.gid = gid;
	}
	public String getUid() {
		return uid;
	}
	public void setUid(String uid) {
		this.uid = uid;
	}
	public ArrayList<Particpant> getParticpant() {
		return particpant;
	}
	public void setParticpant(ArrayList<Particpant> particpant) {
		this.particpant = particpant;
	}
	public String getMessage() {
		return message;
	}
	public void setMessage(String message) {
		this.message = message;
	}
	public String getAllParticpantAndStatus(){
		String part = "";
		for(int i=0;i<particpant.size();i++){
			if(i==0)
				part =""+particpant.get(i).getName();
			else
				part +=":"+particpant.get(i).getName();
		}
		for(int i=0;i<particpant.size();i++){
			if(i==0)
				part +="::"+particpant.get(i).getStatus();
			else
				part +=":"+particpant.get(i).getStatus();
		}
		return part;
	}
	
}
