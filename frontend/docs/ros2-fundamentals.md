---
sidebar_position: 2
chapter_id: "ch01-ros2-fundamentals"
---

# Module 1: ROS 2 Fundamentals

![ROS 2 Fundamentals](/img/ros2-fundamentals.jpg)

## Introduction to Robot Operating System 2

The Robot Operating System 2 (ROS 2) is a flexible framework for writing robot software. It's a collection of tools, libraries, and conventions that aim to simplify the task of creating complex and robust robot behavior across a wide variety of robotic platforms.

### What is ROS 2?

ROS 2 is the next generation of the Robot Operating System, designed to address the limitations of ROS 1 and provide a more robust, secure, and production-ready platform for robotics development. Unlike ROS 1, which was primarily designed for research applications, ROS 2 is built with industrial and commercial deployment in mind.

Key improvements in ROS 2 include:
- Real-time support
- Improved security features
- Better multi-robot support
- Quality of Service (QoS) policies
- Cross-platform compatibility (Linux, Windows, macOS)

### Core Concepts

#### Nodes
A node is an executable that uses ROS 2 to communicate with other nodes. Nodes are the fundamental building blocks of a ROS 2 system. Each node typically performs a specific task and communicates with other nodes through topics, services, or actions.

```python
import rclpy
from rclpy.node import Node

class MinimalPublisher(Node):
    def __init__(self):
        super().__init__('minimal_publisher')
        self.publisher = self.create_publisher(String, 'topic', 10)
        timer_period = 0.5  # seconds
        self.timer = self.create_timer(timer_period, self.timer_callback)

    def timer_callback(self):
        msg = String()
        msg.data = 'Hello World'
        self.publisher.publish(msg)
```

#### Topics and Messages
Topics are named buses over which nodes exchange messages. A node can publish messages to a topic or subscribe to messages from a topic. This creates a publish/subscribe communication pattern that allows for loose coupling between nodes.

Messages are the data structures that are passed between nodes via topics. They are defined in `.msg` files and can contain primitive types like integers, floats, and strings, as well as arrays and other message types.

#### Services
Services provide a request/reply communication pattern. A service client sends a request to a service server, which processes the request and returns a response. This is useful for operations that require a direct response.

#### Actions
Actions are used for long-running tasks that may take a significant amount of time to complete. They provide feedback during execution and can be canceled. Actions are ideal for navigation, manipulation, and other tasks with intermediate results.

### Setting Up Your ROS 2 Environment

#### Installation
ROS 2 can be installed on various platforms. For Ubuntu, the installation process involves:

1. Setting up the ROS 2 apt repository
2. Installing the ROS 2 packages
3. Sourcing the ROS 2 environment

```bash
# Add the ROS 2 apt repository
sudo apt update && sudo apt install curl gnupg lsb-release
sudo curl -sSL https://raw.githubusercontent.com/ros/rosdistro/master/ros.key -o /usr/share/keyrings/ros-archive-keyring.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/ros-archive-keyring.gpg] http://packages.ros.org/ros2/ubuntu $(source /etc/os-release && echo $UBUNTU_CODENAME) main" | sudo tee /etc/apt/sources.list.d/ros2.list > /dev/null

# Install ROS 2 packages
sudo apt update
sudo apt install ros-humble-desktop
```

#### Environment Setup
After installation, source the ROS 2 environment:

```bash
source /opt/ros/humble/setup.bash
```

### Creating Your First ROS 2 Package

A ROS 2 package is a container for ROS 2 code. It contains nodes, libraries, and other resources. To create a new package:

```bash
mkdir -p ~/ros2_ws/src
cd ~/ros2_ws/src
ros2 pkg create --build-type ament_python my_robot_package
```

### Working with URDF (Unified Robot Description Format)

URDF is an XML format for representing a robot model. It defines the physical and visual properties of a robot, including links, joints, and materials.

```xml
<?xml version="1.0"?>
<robot name="simple_robot">
  <link name="base_link">
    <visual>
      <geometry>
        <box size="0.5 0.5 0.5"/>
      </geometry>
      <material name="blue">
        <color rgba="0 0 1 1"/>
      </material>
    </visual>
  </link>

  <link name="sensor_link">
    <visual>
      <geometry>
        <cylinder radius="0.05" length="0.1"/>
      </geometry>
    </visual>
  </link>

  <joint name="sensor_joint" type="fixed">
    <parent link="base_link"/>
    <child link="sensor_link"/>
    <origin xyz="0.2 0 0" rpy="0 0 0"/>
  </joint>
</robot>
```

### ROS 2 and Embodied Intelligence

ROS 2 plays a crucial role in embodied intelligence by providing the communication infrastructure that allows different components of a robotic system to work together. The modular architecture of ROS 2 enables:

- **Distributed Processing**: Different nodes can run on different hardware components (sensors, actuators, processing units)
- **Reusability**: Components developed for one robot can be reused in other robots
- **Simulation Integration**: Easy integration with simulation environments like Gazebo
- **Hardware Abstraction**: Code can be written independently of specific hardware implementations

### Best Practices

1. **Modular Design**: Keep nodes focused on specific tasks
2. **Appropriate QoS Settings**: Choose Quality of Service policies based on your application's requirements
3. **Resource Management**: Properly manage memory and computational resources
4. **Error Handling**: Implement robust error handling and recovery mechanisms
5. **Documentation**: Document your code and interfaces thoroughly

## Try With AI

Try asking your AI companion to explain the differences between ROS 1 and ROS 2 in more detail, or ask for help creating a specific ROS 2 node for your hardware platform. You can also ask for examples of how URDF models are used in actual humanoid robots.