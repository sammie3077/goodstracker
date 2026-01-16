import { useState } from 'react';
import { Work } from '../types';
import { StorageService } from '../services/storageService';
import { toast } from 'sonner';

interface UseWorkManagementProps {
  onRefreshData: () => void;
}

export const useWorkManagement = ({ onRefreshData }: UseWorkManagementProps) => {
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);
  const [isAddWorkOpen, setIsAddWorkOpen] = useState(false);
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  // Handle create work
  const handleCreateWork = async (workName: string) => {
    if (!workName.trim()) {
      toast.error('請填寫作品名稱');
      return;
    }

    try {
      const work = await StorageService.addWork(workName);
      setSelectedWorkId(work.id);
      setIsAddWorkOpen(false);
      onRefreshData();
      toast.success(`已新增作品「${work.name}」`);
    } catch (error) {
      console.error(error);
      toast.error('新增作品失敗');
    }
  };

  // Handle update work name
  const handleUpdateWorkName = async (workId: string, newName: string) => {
    if (!newName.trim()) {
      toast.error('作品名稱不能為空');
      return;
    }

    try {
      await StorageService.updateWork(workId, newName);
      onRefreshData();
      toast.success('作品名稱已更新');
    } catch (error) {
      console.error(error);
      toast.error('更新失敗');
    }
  };

  // Handle delete work
  const handleDeleteWork = async (workId: string) => {
    try {
      await StorageService.deleteWork(workId);
      setSelectedWorkId(null);
      setIsManagerOpen(false);
      onRefreshData();
      toast.success('作品已刪除');
    } catch (error) {
      console.error(error);
      toast.error('刪除失敗');
    }
  };

  return {
    selectedWorkId,
    setSelectedWorkId,
    isAddWorkOpen,
    setIsAddWorkOpen,
    isManagerOpen,
    setIsManagerOpen,
    handleCreateWork,
    handleUpdateWorkName,
    handleDeleteWork,
  };
};
