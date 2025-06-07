import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true, 
    shouldShowList: true,   
  }),
});



const PRIORITY_COLORS = {
  High: '#e74c3c',
  Medium: '#f39c12',
  Low: '#27ae60',
} as const;

type Priority = keyof typeof PRIORITY_COLORS;

type Task = {
  id: string;
  text: string;
  completed: boolean;
  notificationId?: string;
  priority: Priority;
};

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [editTaskText, setEditTaskText] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('Medium');
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    (async () => {
      const json = await AsyncStorage.getItem('tasks');
      if (json) setTasks(JSON.parse(json));
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const scheduleNotification = async (taskText: string): Promise<string | undefined> => {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Task Reminder',
          body: `Time to complete: ${taskText}`,
        },
        trigger: {
          seconds: 10,
          repeats: false,
          type: 'timeInterval',
        } as any, 
      });
      return id;
    } catch (e) {
      console.error('Notification error', e);
    }
  };

  const addTask = async () => {
    if (newTaskText.trim() === '') return Alert.alert('Error', 'Task cannot be empty');

    const notificationId = await scheduleNotification(newTaskText);
    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText,
      completed: false,
      notificationId,
      priority,
    };
    setTasks((prev) => [newTask, ...prev]);
    setNewTaskText('');
    setPriority('Medium');
  };

  const toggleComplete = async (id: string) => {
  setTasks((prev) =>
    prev.map((task) => {
      if (task.id === id) {
        
        if (!task.completed && task.notificationId) {
          Notifications.cancelScheduledNotificationAsync(task.notificationId);
        }
        
        return {
          ...task,
          completed: !task.completed,
          notificationId: task.completed
            ? undefined
            : task.notificationId, 
        };
      }
      return task;
    })
  );
};


  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const startEditTask = (task: Task) => {
    setEditTaskId(task.id);
    setEditTaskText(task.text);
    setEditPriority(task.priority);
    setModalVisible(true);
  };

  const saveEditTask = () => {
    if (editTaskText.trim() === '') return Alert.alert('Error', 'Task cannot be empty');
    setTasks((prev) =>
      prev.map((task) =>
        task.id === editTaskId
          ? { ...task, text: editTaskText, priority: editPriority }
          : task
      )
    );
    setModalVisible(false);
    setEditTaskId(null);
    setEditTaskText('');
  };

  const PrioritySelector = ({ selected, onSelect }: { selected: Priority; onSelect: (p: Priority) => void }) => (
    <View style={styles.prioritySelector}>
      {(Object.keys(PRIORITY_COLORS) as Priority[]).map((p) => (
        <TouchableOpacity
          key={p}
          onPress={() => onSelect(p)}
          style={[
            styles.priorityButton,
            {
              borderColor: selected === p ? PRIORITY_COLORS[p] : '#ccc',
              backgroundColor: selected === p ? PRIORITY_COLORS[p] + '33' : 'transparent',
            },
          ]}
        >
          <Text style={{ color: PRIORITY_COLORS[p], fontWeight: selected === p ? 'bold' : 'normal' }}>{p}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTaskList = (title: string, taskList: Task[]) => (
    <View>
      <Text style={styles.sectionHeader}>{title}</Text>
      <FlatList
        data={taskList.sort((a, b) => {
          const order: Priority[] = ['High', 'Medium', 'Low'];
          return order.indexOf(a.priority) - order.indexOf(b.priority);
        })}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.taskRow}>
            <TouchableOpacity
              onPress={() => toggleComplete(item.id)}
              onLongPress={() => startEditTask(item)}
              style={{ flex: 1 }}
            >
              <Text
                style={[
                  styles.taskText,
                  item.completed && styles.completedTask,
                  { color: PRIORITY_COLORS[item.priority] },
                ]}
              >
                {item.text} ({item.priority})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteTask(item.id)} style={styles.deleteButton}>
              <Text style={{ color: 'white' }}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center' }}>No tasks</Text>}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Tasks</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Enter a new task"
          value={newTaskText}
          onChangeText={setNewTaskText}
        />
        <Button title="Add" onPress={addTask} />
      </View>
      <PrioritySelector selected={priority} onSelect={setPriority} />
      {renderTaskList('Active Tasks', tasks.filter((t) => !t.completed))}
      {renderTaskList('Completed Tasks', tasks.filter((t) => t.completed))}

      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text>Edit Task</Text>
            <TextInput value={editTaskText} onChangeText={setEditTaskText} style={styles.input} autoFocus />
            <PrioritySelector selected={editPriority} onSelect={setEditPriority} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
              <Pressable onPress={saveEditTask} style={[styles.modalButton, { backgroundColor: '#2196F3' }]}>
                <Text style={{ color: 'white' }}>Save</Text>
              </Pressable>
              <Pressable onPress={() => setModalVisible(false)} style={[styles.modalButton, { backgroundColor: '#ccc' }]}>
                <Text>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  taskText: {
    fontSize: 16,
  },
  completedTask: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  deleteButton: {
    backgroundColor: 'red',
    padding: 8,
    borderRadius: 5,
  },
  prioritySelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  priorityButton: {
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
});
