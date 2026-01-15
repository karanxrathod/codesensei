
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  addDoc,
  onSnapshot,
  increment
} from "firebase/firestore";
import { db } from "./firebase";
import { Project, ChatMessage } from "../types";

// User Profile Operations
export const createUserProfile = async (userId: string, userData: any) => {
  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        ...userData,
        joinedDate: serverTimestamp(),
        projectsAnalyzed: 0,
        lastLogin: serverTimestamp(),
      });
    } else {
      await updateDoc(userRef, { lastLogin: serverTimestamp() });
    }
    return { success: true };
  } catch (error: any) {
    console.error("Error creating user profile:", error);
    return { success: false, error: error.message };
  }
};

// Project Operations
export const createProject = async (userId: string, projectData: Partial<Project>) => {
  try {
    const docRef = await addDoc(collection(db, "projects"), {
      ...projectData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      progress: projectData.progress || 0,
    });
    
    // Increment stats
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { projectsAnalyzed: increment(1) });
    
    return docRef.id;
  } catch (error: any) {
    console.error("Error creating project:", error);
    throw error;
  }
};

export const listenToUserProjects = (userId: string, callback: (projects: Project[]) => void, onError?: (error: any) => void) => {
  const q = query(
    collection(db, "projects"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  
  return onSnapshot(q, (snapshot) => {
    const projects: Project[] = [];
    snapshot.forEach((doc) => {
      projects.push({ id: doc.id, ...doc.data() } as Project);
    });
    callback(projects);
  }, (error) => {
    console.error("Projects snapshot error:", error);
    if (onError) onError(error);
  });
};

export const updateProjectInDB = async (projectId: string, updates: Partial<Project>) => {
  try {
    const docRef = doc(db, "projects", projectId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating project:", error);
  }
};

// Chat Operations
export const saveChatMessageToDB = async (projectId: string, userId: string, message: Partial<ChatMessage>) => {
  try {
    await addDoc(collection(db, "chat_messages"), {
      projectId,
      userId,
      role: message.role,
      content: message.content,
      timestamp: serverTimestamp(),
      files: message.files || [],
    });
  } catch (error: any) {
    console.error("Error saving chat message:", error);
    throw error;
  }
};

export const getChatHistoryFromDB = async (projectId: string): Promise<ChatMessage[]> => {
  try {
    const q = query(
      collection(db, "chat_messages"),
      where("projectId", "==", projectId),
      orderBy("timestamp", "asc")
    );
    const snap = await getDocs(q);
    const messages: ChatMessage[] = [];
    snap.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        role: data.role,
        content: data.content,
        timestamp: data.timestamp?.toDate() || new Date(),
        files: data.files,
      } as ChatMessage);
    });
    return messages;
  } catch (error: any) {
    console.error("Error fetching chat history:", error);
    return [];
  }
};
