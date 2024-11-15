import React, { useState, useEffect } from 'react';
import Home from './components/home/home';
import Playlist from './components/playist/playlist';
import axios from 'axios';

function App() {
  const [user, setUser] = useState(null);
  const [isLoggin, setIsLoggin] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      window.electron.ipcRenderer.send('get-user');
      const data = await new Promise(resolve => {
        window.electron.ipcRenderer.once('get-user-reply', (_, data) => {
          resolve(data);
        });
      });
      setUser(data);
    };

    getUser();

    // Listen for data updates
    const handleDataUpdate = (_, updatedData) => {
      setUser(prevUser => ({
        ...prevUser,
        allPlaylists: updatedData.playlists,
        campaigns: updatedData.campaigns
      }));
    };

    window.electron.ipcRenderer.on('data-updated', handleDataUpdate);

    return () => {
      window.electron.ipcRenderer.removeAllListeners('get-user-reply');
      window.electron.ipcRenderer.removeListener('data-updated', handleDataUpdate);
    };
  }, []);
  console.log(user)
  function checkStatus(){
    axios.post(`http://localhost:8000/api/updateUserStatusApi/${user.id}/online`).then(res=>{
      console.log(res)
    })
  }

  useEffect(() => {
    if (user) {
      setIsLoggin(true);
      checkStatus()
    }
  }, [user]);

  useEffect(() => {
    window.electron.ipcRenderer.send("updateMessage");
    window.electron.ipcRenderer.once("update-message-reply", (_2, data) => {
      setUpdateMessage(data);
      if (data.includes('Güncelleme mevcut')) {
        setIsModalOpen(true);
      }
      else if (data.includes('Güncelleme indiriliyor.')) {
        setIsModalOpen(true);
      }
    });
    return () => {
      window.electron.ipcRenderer.removeAllListeners("update-message-reply");

    };
  }, [updateMessage]);


  const handleUpdate = () => {
    window.electron.ipcRenderer.send('start-update');
    setIsModalOpen(false);
  };

  return (
    <>
      {isLoggin ? <Playlist data={user} /> : <Home />}
      {updateMessage === "Güncelleme mevcut." && (
        <div className="modal1" style={{ display: isModalOpen ? 'block' : 'none' }}>
          <div className="modal-content1">
            <div style={{ display: "flex", flexDirection: "row",alignItems:"center",justifyContent:"space-between" }}>
              <span style={{
                fontFamily: "Arial", fontSize: "20px", fontWeight: "700", lineHeight: "23px", textAlign: "left",color:"black"
              }}>{updateMessage}</span>
              <span className="close" onClick={() => setIsModalOpen(false)}>&times;</span>
            </div>
            <p>Müzik uygulamamız için yeni bir güncelleme mevcut. En son özellikleri kullanmak için lütfen uygulamayı güncelleyin.</p>
            {updateMessage === "Güncelleme indiriliyor." ? null : <button className='btn-mes' onClick={handleUpdate}>Uygulamayı Güncelle</button>}
          </div>
        </div>
      )}
    </>
  );
}

export default App;
