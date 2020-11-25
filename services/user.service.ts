import HashHelper from "../helpers/hash.helper.ts";
import { throwError } from "../middlewares/errorHandler.middleware.ts";
import log from "../middlewares/logger.middleware.ts";
import { User, UserSchema } from "../models/user.model.ts";
import { UserHistory, UserHistorySchema } from "../models/user_history.model.ts";
import { ObjectId, Status } from "../deps.ts";
import type {
  CreateUserStructure,
  SignupUserStructure,
  UpdatedStructure,
  UpdateUserStructure,
  UserStructure,
} from "../types/types.interface.ts";

class UserService {

  /**
   * Create user Service
   * @param options
   * @returns Promise<ObjectId | Error> Returns Mongo Id of user document
   */
  public static async createUser(
    options: CreateUserStructure,
  ): Promise<ObjectId | Error> {
    const { name, email, password, role, isVerified, isDisabled } = options;
    const hashedPassword = await HashHelper.encrypt(password);
    const createdAt = new Date();

    const user: ObjectId = await User.insertOne(
      { name, email, password: hashedPassword, role, isVerified, isDisabled, createdAt, __v: 1},
    );

    if(user){
      const user_history: ObjectId = await UserHistory.insertOne(
        {id:user,  name, email, password: hashedPassword, role, isVerified, isDisabled, createdAt, __v: 1},
      );
    }
    else {
      log.error("Could not create user");
      return throwError({
        status: Status.BadRequest,
        name: "BadRequest",
        path: "user",
        param: "user",
        message: `Could not create user`,
        type: "BadRequest",
      });
    }
    return user;
  }


/**
 * Signup user Service
 * @param name
 * @param email
 * @param password
 * @returns Promise<ObjectId | Error> Returns Mongo Id of user document
 */
public static async signupUser(
  options: SignupUserStructure,
): Promise<ObjectId | Error> {
  const { name, email, password, role, isVerified, isDisabled} = options;
  const hashedPassword = await HashHelper.encrypt(password);
  const createdAt = new Date();

  const user: ObjectId = await User.insertOne(
    { name, email, password: hashedPassword, role, isVerified, isDisabled, createdAt, __v: 1},
  );

  if(user){
    const user_history: ObjectId = await UserHistory.insertOne(
      {id:user,  name, email, password: hashedPassword, role, isVerified, isDisabled, createdAt, __v: 1},
    );
  }
  else {
    log.error("Could not create user");
    return throwError({
      status: Status.BadRequest,
      name: "BadRequest",
      path: "user",
      param: "user",
      message: `Could not create user`,
      type: "BadRequest",
    });
  }
  return user;
}


  /**
   * Get users service
   * @returns UserSchema[] Returns Array of users documents
   */
  public static async getUsers(): Promise<UserSchema[]> {
    return User.find();
  }

  /**
   * Get single user service
   * @param id
   * @returns Promise<UserSchema | Error> Returns user document
   */
  public static async getUser(id: string): Promise<UserStructure | Error> {
    const user: (UserSchema | null) = await User.findOne({ _id: ObjectId(id) });
    if (!user) {
      log.error("User not found");
      return throwError({
        status: Status.NotFound,
        name: "NotFound",
        path: "user",
        param: "user",
        message: `User not found`,
        type: "NotFound",
      });
    }
    const { name, email, role, isDisabled, isVerified, createdAt, updatedAt } = user;
    return { id, name, email, role, isDisabled, isVerified, createdAt, updatedAt };
  }

  /**
   * Update user service
   * @param id
   * @param options
   * @returns Promise<UpdatedStructure | Error> Returns Updated acknowledgement
   */
  public static async updateUser(
    id: string,
    options: UpdateUserStructure,
  ): Promise<UpdatedStructure | Error> {
    const user: (UserSchema | null) = await User.findOne({ _id: ObjectId(id) });
    if (!user) {
      log.error("User not found");
      return throwError({
        status: Status.NotFound,
        name: "NotFound",
        path: "user",
        param: "user",
        message: `User not found`,
        type: "NotFound",
      });
    }
    const { __v } = user;
    const new___v = __v + 1
    const { name, role, isVerified, isDisabled } = options;
    const updatedAt = new Date();
    const result: ({
      matchedCount: number;
      modifiedCount: number;
      upsertedId: ObjectId | null;
    }) = await User.updateOne({ _id: ObjectId(id) }, {
      $set: {
        name,
        role,
        isVerified,
        isDisabled,
        updatedAt,
        __v: new___v
      },
    },
    );
    if(result){
      const user_history: ObjectId = await UserHistory.insertOne(
        {id:ObjectId(id) , name, role, isVerified, isDisabled, updatedAt, __v: new___v},
      );
    }
    else {
      return throwError({
        status: Status.BadRequest,
        name: "BadRequest",
        path: "user",
        param: "user",
        message: `Could not update user`,
        type: "BadRequest",
      });
    }

    return result;
  }

  /**
   * Remove user service
   * @param id
   * @returns Promise<number | Error Returns deleted count
   */
  public static async removeUser(id: string): Promise<number | Error> {
    const user: (UserSchema | null) = await User.findOne({ _id: ObjectId(id) });
    if (!user) {
      log.error("User not found");
      return throwError({
        status: Status.NotFound,
        name: "NotFound",
        path: "user",
        param: "user",
        message: `User not found`,
        type: "NotFound",
      });
    }
    const deleteCount: number = await User.deleteOne({ _id: ObjectId(id) });
    if (deleteCount) {
      const {name, email, role, isVerified, isDisabled, createdAt,  __v } = user;
      const new___v = __v + 1
      const updatedAt = new Date();
      const user_history: ObjectId = await UserHistory.insertOne(
        {id:ObjectId(id) , name, email, role, isVerified, isDisabled, createdAt, updatedAt, __v: new___v},
      );
    }
    else {
      return throwError({
        status: Status.BadRequest,
        name: "BadRequest",
        path: "user",
        param: "user",
        message: `Could not delete user`,
        type: "BadRequest",
      });
    }
    return deleteCount;
  }
}

export default UserService;
