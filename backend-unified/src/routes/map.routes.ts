import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();
const AMAP_KEY = process.env.AMAP_KEY || '7dbf7668048c2a3fa77ab081b2f9c879';

// 逆地理编码 - 坐标转地址
router.get('/geocode/regeo', async (req: Request, res: Response) => {
  try {
    const { longitude, latitude } = req.query;
    
    if (!longitude || !latitude) {
      return res.status(400).json({
        code: 400,
        message: '缺少参数：longitude, latitude'
      });
    }

    const response = await axios.get('https://restapi.amap.com/v3/geocode/regeo', {
      params: {
        key: AMAP_KEY,
        location: `${longitude},${latitude}`,
        extensions: 'base',
        output: 'json'
      }
    });

    if (response.data.status === '1') {
      res.json({
        code: 200,
        data: {
          address: response.data.regeocode.formatted_address,
          addressComponent: response.data.regeocode.addressComponent
        }
      });
    } else {
      res.status(500).json({
        code: 500,
        message: response.data.info || '地址解析失败'
      });
    }
  } catch (error: any) {
    console.error('地图API调用失败:', error.message);
    res.status(500).json({
      code: 500,
      message: 'API调用失败'
    });
  }
});

// 地理编码 - 地址转坐标
router.get('/geocode/geo', async (req: Request, res: Response) => {
  try {
    const { address } = req.query;
    
    if (!address) {
      return res.status(400).json({
        code: 400,
        message: '缺少参数：address'
      });
    }

    const response = await axios.get('https://restapi.amap.com/v3/geocode/geo', {
      params: {
        key: AMAP_KEY,
        address: address,
        output: 'json'
      }
    });

    if (response.data.status === '1' && response.data.geocodes.length > 0) {
      const location = response.data.geocodes[0].location.split(',');
      res.json({
        code: 200,
        data: {
          longitude: parseFloat(location[0]),
          latitude: parseFloat(location[1]),
          level: response.data.geocodes[0].level
        }
      });
    } else {
      res.status(500).json({
        code: 500,
        message: response.data.info || '地址解析失败'
      });
    }
  } catch (error: any) {
    console.error('地图API调用失败:', error.message);
    res.status(500).json({
      code: 500,
      message: 'API调用失败'
    });
  }
});

export default router;















