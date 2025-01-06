import { defineStore } from 'pinia';
// import { pinia } from '@/store';
const main_image_url = 'https://koc-img.lizhibj.cn/applet';

export const useImageStore = defineStore({
  id: 'image',
  state: () => {
    return {
      data: `${main_image_url}/data.png`,
      notfond: `${main_image_url}/404.png`,
      address: `${main_image_url}/address.png`,
      car: `${main_image_url}/car.png`,
      message: `${main_image_url}/message.png`,
      message_list: `${main_image_url}/message_list.png`,
      order: `${main_image_url}/order.png`,
      search: `${main_image_url}/search.png`,
      wifi: `${main_image_url}/wifi.png`,
      premission: `${main_image_url}/premission.png`,
      bank: `${main_image_url}/bank.png`,
      empty: `${main_image_url}/empty.png`,
      lock: `${main_image_url}/lock.png`,
      unlock: `${main_image_url}/unlock.png`,
      data_main: `${main_image_url}/data_main.png`,
      extension: `${main_image_url}/extension.png`,
      building: `${main_image_url}/building.png`,
    };
  },
});
