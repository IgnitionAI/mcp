export const getGreeting = (name: string | string[]) => {
  const nameStr = Array.isArray(name) ? name[0] : name;
  
  return {
    contents: [{
      uri: `greeting://${nameStr}`,
      text: `Hello, ${nameStr}!`
    }]
  };
};

export const getUserProfile = (userId: string | string[]) => {
  // Convertir en chaîne si c'est un tableau
  const id = Array.isArray(userId) ? userId[0] : userId;
  
  const profiles = {
    "1": { name: "Alice", age: 28, job: "Développeur" },
    "2": { name: "Bob", age: 34, job: "Designer" },
    "3": { name: "Charlie", age: 42, job: "Manager" }
  };
  
  const profile = id in profiles 
    ? profiles[id as keyof typeof profiles] 
    : { name: "Inconnu", age: 0, job: "N/A" };
  
  return {
    contents: [{
      uri: `user-profile://${id}`,
      text: JSON.stringify(profile, null, 2)
    }]
  };
};

export const listUserProfiles = () => ({
  resources: [
    { 
      name: "Utilisateur 1", 
      uri: "user-profile://1", 
      description: "Profil de l'utilisateur 1" 
    },
    { 
      name: "Utilisateur 2", 
      uri: "user-profile://2", 
      description: "Profil de l'utilisateur 2" 
    },
    { 
      name: "Utilisateur 3", 
      uri: "user-profile://3", 
      description: "Profil de l'utilisateur 3" 
    }
  ]
});
