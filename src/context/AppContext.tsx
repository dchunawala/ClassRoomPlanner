import React, { createContext, useContext, useState, ReactNode } from 'react';
import { addDays, format } from 'date-fns';
import dayjs from 'dayjs';

interface Semester {
  id: string;
  name: string;
  year: number;
  startDate: string;
  endDate: string;
  isStarred: boolean;
}

interface Room {
  id: string;
  semesterId: string;
  roomNumber: string;
  capacity: number;
}

export interface Class {
  id: string;
  semesterId: string;
  roomId: string;
  courseCode: string;
  courseNumber: string;
  section: string;
  instructor: string;
  startTime: string;
  endTime: string;
  days: string[];
}

interface AppContextType {
  semesters: Semester[];
  rooms: Room[];
  classes: Class[];
  addSemester: (name: string, year: number, sourceSemesterId?: string) => void;
  deleteSemester: (id: string) => void;
  toggleSemesterStar: (id: string) => void;
  editSemesterDates: (id: string, startDate: string, endDate: string) => void;
  addRoom: (semesterId: string, roomNumber: string, capacity: number) => void;
  editRoom: (id: string, roomNumber: string, capacity: number) => void;
  deleteRoom: (id: string) => void;
  addClass: (classData: Omit<Class, 'id'>) => void;
  editClass: (id: string, classData: Omit<Class, 'id'>) => void;
  deleteClass: (id: string) => void;
  checkRoomAvailability: (roomId: string, startTime: string, endTime: string, days: string[], excludeClassId?: string) => 
    { available: boolean; conflict?: string };
  checkScheduleConflict: (classData: Omit<Class, 'id'>) => 
    { conflict: boolean; conflictingClass?: string };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [semesters, setSemesters] = useState<Semester[]>(() => {
    const saved = localStorage.getItem('semesters');
    return saved ? JSON.parse(saved) : [];
  });
  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = localStorage.getItem('rooms');
    return saved ? JSON.parse(saved) : [];
  });
  const [classes, setClasses] = useState<Class[]>(() => {
    const saved = localStorage.getItem('classes');
    return saved ? JSON.parse(saved) : [];
  });

  // Save to localStorage whenever data changes
  React.useEffect(() => {
    localStorage.setItem('semesters', JSON.stringify(semesters));
  }, [semesters]);

  React.useEffect(() => {
    localStorage.setItem('rooms', JSON.stringify(rooms));
  }, [rooms]);

  React.useEffect(() => {
    localStorage.setItem('classes', JSON.stringify(classes));
  }, [classes]);

  const addSemester = (name: string, year: number, sourceSemesterId?: string) => {
    const isDuplicate = semesters.some(sem => 
      sem.name === name && sem.year === year
    );

    if (isDuplicate) {
      throw new Error('A semester with this name and year already exists');
    }

    let monthIndex = 0; // Spring starts in January
    if (name === 'Fall') {
      monthIndex = 7; // Fall starts in August
    } else if (name === 'Summer I') {
      monthIndex = 4; // Summer I starts in May
    } else if (name === 'Summer II') {
      monthIndex = 5; // Summer II starts in June
    }

    const startDate = format(new Date(year, monthIndex, 1), 'yyyy-MM-dd');
    const endDate = format(addDays(new Date(startDate), name.includes('Summer') ? 60 : 120), 'yyyy-MM-dd');
    
    const newSemesterId = Math.random().toString(36).substr(2, 9);
    const newSemester: Semester = {
      id: newSemesterId,
      name,
      year,
      startDate,
      endDate,
      isStarred: false
    };

    setSemesters([...semesters, newSemester]);

    if (sourceSemesterId) {
      // Clone rooms
      const sourceRooms = rooms.filter(room => room.semesterId === sourceSemesterId);
      const clonedRooms = sourceRooms.map(room => ({
        ...room,
        id: Math.random().toString(36).substr(2, 9),
        semesterId: newSemesterId
      }));
      setRooms([...rooms, ...clonedRooms]);

      // Clone classes
      const sourceClasses = classes.filter(cls => cls.semesterId === sourceSemesterId);
      const roomIdMap = clonedRooms.reduce((map, room) => {
        const sourceRoom = sourceRooms.find(sr => sr.roomNumber === room.roomNumber);
        if (sourceRoom) {
          map[sourceRoom.id] = room.id;
        }
        return map;
      }, {} as { [key: string]: string });

      const clonedClasses = sourceClasses.map(cls => ({
        ...cls,
        id: Math.random().toString(36).substr(2, 9),
        semesterId: newSemesterId,
        roomId: roomIdMap[cls.roomId]
      }));
      setClasses([...classes, ...clonedClasses]);
    }
  };

  const deleteSemester = (id: string) => {
    setSemesters(semesters.filter(sem => sem.id !== id));
    setRooms(rooms.filter(room => room.semesterId !== id));
    setClasses(classes.filter(cls => cls.semesterId !== id));
  };

  const toggleSemesterStar = (id: string) => {
    const starredCount = semesters.filter(sem => sem.isStarred).length;
    const semester = semesters.find(sem => sem.id === id);
    
    if (!semester) return;
    
    // If trying to star and already at limit
    if (!semester.isStarred && starredCount >= 4) {
      throw new Error('Cannot star more than 4 semesters');
    }

    setSemesters(semesters.map(sem => ({
      ...sem,
      isStarred: sem.id === id ? !sem.isStarred : sem.isStarred
    })));
  };

  const editSemesterDates = (id: string, startDate: string, endDate: string) => {
    const semesterIndex = semesters.findIndex(sem => sem.id === id);
    if (semesterIndex === -1) {
      throw new Error('Semester not found');
    }

    const updatedSemesters = [...semesters];
    updatedSemesters[semesterIndex] = {
      ...updatedSemesters[semesterIndex],
      startDate,
      endDate
    };
    setSemesters(updatedSemesters);
  };

  const addRoom = (semesterId: string, roomNumber: string, capacity: number) => {
    const isDuplicate = rooms.some(room => 
      room.semesterId === semesterId && 
      room.roomNumber.toLowerCase() === roomNumber.toLowerCase()
    );
    
    if (isDuplicate) {
      throw new Error('A room with this number already exists in this semester');
    }

    const newRoom: Room = {
      id: Math.random().toString(36).substr(2, 9),
      semesterId,
      roomNumber,
      capacity
    };
    setRooms([...rooms, newRoom]);
  };

  const editRoom = (id: string, roomNumber: string, capacity: number) => {
    const roomIndex = rooms.findIndex(room => room.id === id);
    if (roomIndex === -1) {
      throw new Error('Room not found');
    }
    
    const isDuplicate = rooms.some(room => 
      room.id !== id &&
      room.semesterId === rooms[roomIndex].semesterId &&
      room.roomNumber.toLowerCase() === roomNumber.toLowerCase()
    );
    
    if (isDuplicate) {
      throw new Error('A room with this number already exists in this semester');
    }

    const updatedRooms = [...rooms];
    updatedRooms[roomIndex] = {
      ...updatedRooms[roomIndex],
      roomNumber,
      capacity
    };
    setRooms(updatedRooms);
    return updatedRooms[roomIndex];
  };
  
  const deleteRoom = (id: string) => {
    const room = rooms.find(r => r.id === id);
    if (!room) {
      throw new Error('Room not found');
    }
    
    // Check if any classes are using this room
    const classesUsingRoom = classes.filter(c => c.roomId === id);
    if (classesUsingRoom.length > 0) {
      throw new Error('Cannot delete room - there are classes assigned to it');
    }
    
    setRooms(rooms.filter(r => r.id !== id));
  };

  const addClass = (classData: Omit<Class, 'id'>) => {
    const isDuplicate = classes.some(cls =>
      cls.semesterId === classData.semesterId &&
      cls.courseCode.toLowerCase() === classData.courseCode.toLowerCase() &&
      cls.courseNumber === classData.courseNumber &&
      cls.section.toLowerCase() === classData.section.toLowerCase()
    );

    if (isDuplicate) {
      throw new Error('A class with this course code, number, and section already exists in this semester');
    }
    
    // Check room availability for the new time slot
    const availability = checkRoomAvailability(classData.roomId, classData.startTime, classData.endTime, classData.days);
    if (!availability.available) {
      throw new Error(`Room is not available during selected time slot. Conflict with: ${availability.conflict}`);
    }

    const newClass: Class = {
      ...classData,
      id: Math.random().toString(36).substr(2, 9)
    };
    setClasses([...classes, newClass]);
  };

  const editClass = (id: string, classData: Omit<Class, 'id'>) => {
    const classIndex = classes.findIndex(cls => cls.id === id);
    if (classIndex === -1) {
      throw new Error('Class not found');
    }
    
    const isDuplicate = classes.some(cls =>
      cls.id !== id &&
      cls.semesterId === classData.semesterId &&
      cls.courseCode.toLowerCase() === classData.courseCode.toLowerCase() &&
      cls.courseNumber === classData.courseNumber &&
      cls.section.toLowerCase() === classData.section.toLowerCase()
    );

    if (isDuplicate) {
      throw new Error('A class with this course code, number, and section already exists in this semester');
    }

    // Check room availability for the new time slot
    const availability = checkRoomAvailability(classData.roomId, classData.startTime, classData.endTime, classData.days, id);
    if (!availability.available) {
      throw new Error(`Room is not available during selected time slot. Conflict with: ${availability.conflict}`);
    }

    const updatedClasses = [...classes];
    updatedClasses[classIndex] = {
      ...updatedClasses[classIndex],
      ...classData
    };
    setClasses(updatedClasses);
    return updatedClasses[classIndex];
  };
  
  const deleteClass = (id: string) => {
    const classToDelete = classes.find(c => c.id === id);
    if (!classToDelete) {
      throw new Error('Class not found');
    }
    
    setClasses(classes.filter(c => c.id !== id));
  };

  const convertTimeToMinutes = (timeStr: string) => {
    const time = dayjs(timeStr, 'h:mmA');
    return time.hour() * 60 + time.minute();
  };

  const hasTimeOverlap = (start1: number, end1: number, start2: number, end2: number) => {
    // Two time slots overlap if one starts before the other ends
    return start1 < end2 && end1 > start2;
  };

  const checkRoomAvailability = (roomId: string, startTime: string, endTime: string, days: string[], excludeClassId?: string) => {
    const newStart = convertTimeToMinutes(startTime);
    const newEnd = convertTimeToMinutes(endTime);

    const conflictingClass = classes.find(cls => {
      if (cls.roomId !== roomId) return false;
      if (excludeClassId && cls.id === excludeClassId) return false;
      if (!cls.days.some(day => days.includes(day))) return false;

      const existingStart = convertTimeToMinutes(cls.startTime);
      const existingEnd = convertTimeToMinutes(cls.endTime);

      return hasTimeOverlap(newStart, newEnd, existingStart, existingEnd);
    });
    
    if (conflictingClass) {
      return {
        available: false,
        conflict: `${conflictingClass.courseCode}-${conflictingClass.courseNumber}-${conflictingClass.section}`
      };
    }
    
    return { available: true };
  };

  const checkScheduleConflict = (classData: Omit<Class, 'id'>) => {
    const newStart = convertTimeToMinutes(classData.startTime);
    const newEnd = convertTimeToMinutes(classData.endTime);

    const conflictingClass = classes.find(cls => {
      if (cls.semesterId !== classData.semesterId) return false;
      if (!cls.days.some(day => classData.days.includes(day))) return false;

      const existingStart = convertTimeToMinutes(cls.startTime);
      const existingEnd = convertTimeToMinutes(cls.endTime);

      return hasTimeOverlap(newStart, newEnd, existingStart, existingEnd);
    });
    
    if (conflictingClass) {
      return {
        conflict: true,
        conflictingClass: `${conflictingClass.courseCode}-${conflictingClass.courseNumber}-${conflictingClass.section}`
      };
    }
    
    return { conflict: false };
  };

  const value = {
    semesters,
    rooms,
    classes,
    addSemester,
    deleteSemester,
    toggleSemesterStar,
    editSemesterDates,
    addRoom,
    editRoom,
    deleteRoom,
    addClass,
    editClass,
    deleteClass,
    checkRoomAvailability,
    checkScheduleConflict
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};