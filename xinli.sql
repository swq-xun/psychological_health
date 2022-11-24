/*
SQLyog Ultimate v12.08 (64 bit)
MySQL - 8.0.26 : Database - xinli
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`xinli` /*!40100 DEFAULT CHARACTER SET utf8 */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `xinli`;

/*Table structure for table `fenduan` */

DROP TABLE IF EXISTS `fenduan`;

CREATE TABLE `fenduan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `start` double DEFAULT NULL,
  `end` double DEFAULT NULL,
  `guo` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb3;

/*Data for the table `fenduan` */

insert  into `fenduan`(`id`,`start`,`end`,`guo`) values (9,0,59,'抑郁'),(10,60,85,'正常'),(11,85,100,'精神非常好');

/*Table structure for table `liaotian` */

DROP TABLE IF EXISTS `liaotian`;

CREATE TABLE `liaotian` (
  `id` int NOT NULL AUTO_INCREMENT,
  `one` int DEFAULT NULL,
  `two` int DEFAULT NULL,
  `content` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb3;

/*Data for the table `liaotian` */

insert  into `liaotian`(`id`,`one`,`two`,`content`) values (17,6,7,'<div style=\"margin-top: 10px\">李丽说:无奈</div><div style=\"margin-top: 10px\">李丽说:好累啊</div><div style=\"margin-top: 10px\">孙策说:去你的</div>');

/*Table structure for table `mokuai` */

DROP TABLE IF EXISTS `mokuai`;

CREATE TABLE `mokuai` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) DEFAULT NULL,
  `quanzhon` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb3;

/*Data for the table `mokuai` */

insert  into `mokuai`(`id`,`name`,`quanzhon`) values (3,'第一模块','30'),(4,'第二模块','30'),(5,'第三模块','30');

/*Table structure for table `timu` */

DROP TABLE IF EXISTS `timu`;

CREATE TABLE `timu` (
  `id` int NOT NULL AUTO_INCREMENT,
  `xuhao` int DEFAULT NULL,
  `them` varchar(200) DEFAULT NULL,
  `one` varchar(200) DEFAULT NULL,
  `two` varchar(200) DEFAULT NULL,
  `three` varchar(200) DEFAULT NULL,
  `four` varchar(200) DEFAULT NULL,
  `ok` varchar(200) DEFAULT NULL,
  `fen` double DEFAULT NULL,
  `da` varchar(200) DEFAULT NULL,
  `mokuaiId` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb3;

/*Data for the table `timu` */

insert  into `timu`(`id`,`xuhao`,`them`,`one`,`two`,`three`,`four`,`ok`,`fen`,`da`,`mokuaiId`) values (8,1,'童年','快乐','悲伤','兴奋','优秀','快乐',20,NULL,3),(9,2,'成年','压抑','忧郁','失败','成功','成功',10,NULL,3),(10,1,'吃饭','爱吃','厌食','暴饮暴食','正常就餐','正常就餐',20,NULL,4),(11,2,'睡觉','嗜睡','失眠','正常','压抑','正常',30,NULL,4),(12,1,'自我评价','正常','神经','快乐','失败','快乐',10,NULL,5),(13,2,'未来规划','努力生活','混吃等死','积极向上','好好学习','积极向上',10,NULL,5);

/*Table structure for table `user` */

DROP TABLE IF EXISTS `user`;

CREATE TABLE `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(200) DEFAULT NULL,
  `password` varchar(200) DEFAULT NULL,
  `type` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb3;

/*Data for the table `user` */

insert  into `user`(`id`,`username`,`password`,`type`) values (1,'admin','123',0),(6,'李丽','123',1),(7,'孙策','123',1),(8,'李云','123',1);

/*Table structure for table `ut` */

DROP TABLE IF EXISTS `ut`;

CREATE TABLE `ut` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int DEFAULT NULL,
  `xuhao` int DEFAULT NULL,
  `them` varchar(200) DEFAULT NULL,
  `one` varchar(200) DEFAULT NULL,
  `two` varchar(200) DEFAULT NULL,
  `three` varchar(200) DEFAULT NULL,
  `four` varchar(200) DEFAULT NULL,
  `ok` varchar(200) DEFAULT NULL,
  `da` varchar(200) DEFAULT NULL,
  `fen` double DEFAULT NULL,
  `mokuaiId` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=142 DEFAULT CHARSET=utf8mb3;

/*Data for the table `ut` */

insert  into `ut`(`id`,`userId`,`xuhao`,`them`,`one`,`two`,`three`,`four`,`ok`,`da`,`fen`,`mokuaiId`) values (118,7,1,'童年','快乐','悲伤','兴奋','优秀','快乐','快乐',20,3),(119,7,2,'成年','压抑','忧郁','失败','成功','成功','压抑',0,3),(120,7,1,'吃饭','爱吃','厌食','暴饮暴食','正常就餐','正常就餐','正常就餐',20,4),(121,7,2,'睡觉','嗜睡','失眠','正常','压抑','正常','正常',30,4),(122,7,1,'自我评价','正常','神经','快乐','失败','快乐','正常',0,5),(123,7,2,'未来规划','努力生活','混吃等死','积极向上','好好学习','积极向上','努力生活',0,5),(130,8,1,'童年','快乐','悲伤','兴奋','优秀','快乐','快乐',20,3),(131,8,2,'成年','压抑','忧郁','失败','成功','成功','成功',10,3),(132,8,1,'吃饭','爱吃','厌食','暴饮暴食','正常就餐','正常就餐','正常就餐',20,4),(133,8,2,'睡觉','嗜睡','失眠','正常','压抑','正常','正常',30,4),(134,8,1,'自我评价','正常','神经','快乐','失败','快乐','快乐',10,5),(135,8,2,'未来规划','努力生活','混吃等死','积极向上','好好学习','积极向上','积极向上',10,5),(136,6,1,'童年','快乐','悲伤','兴奋','优秀','快乐','快乐',20,3),(137,6,2,'成年','压抑','忧郁','失败','成功','成功','失败',0,3),(138,6,1,'吃饭','爱吃','厌食','暴饮暴食','正常就餐','正常就餐','暴饮暴食',0,4),(139,6,2,'睡觉','嗜睡','失眠','正常','压抑','正常','正常',30,4),(140,6,1,'自我评价','正常','神经','快乐','失败','快乐','神经',0,5),(141,6,2,'未来规划','努力生活','混吃等死','积极向上','好好学习','积极向上','努力生活',0,5);

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
