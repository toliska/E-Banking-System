import { useEffect, useState } from "react";
import Table from './Ui/Table';
import axios from "axios";

const config = require("../config");
const API_URL = config.IP_BACKEND;

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [editUserId, setEditUserId] = useState(null);
  const [editedUser, setEditedUser] = useState({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/users`);
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users", error);
    }
  };

  const handleEdit = (user) => {
    setEditUserId(user.id);
    setEditedUser({ ...user }); // Copy user data for editing
  };

  const handleChange = (e, field) => {
    setEditedUser({ ...editedUser, [field]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await axios.put(`${API_URL}/api/users/${editedUser.id}`, editedUser);
      setEditUserId(null); // Exit edit mode
      fetchUsers(); // Refresh user data
    } catch (error) {
      console.error("Error updating user", error);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Admin Dashboard</h1>
      <Table 
        users={users} 
        editUserId={editUserId}
        editedUser={editedUser}
        onEdit={handleEdit} 
        onChange={handleChange}
        onSave={handleSave} 
      />
    </div>
  );
}
